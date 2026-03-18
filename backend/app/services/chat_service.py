"""
AI Chat Assistant — Gemini-powered with keyword fallback.
"""
import os
import re
import logging
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.destination import Destination

logger = logging.getLogger("nepalgo.chat")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")

_destination_names: list[dict] = []


async def load_destination_names(db: AsyncSession):
    global _destination_names
    result = await db.execute(
        select(
            Destination.name,
            Destination.slug,
            Destination.description,
            Destination.best_season,
            Destination.base_price_per_day,
            Destination.difficulty,
            Destination.category,
            Destination.region
        )
    )
    _destination_names = [
        {
            "name": r[0], "slug": r[1], "description": r[2],
            "best_season": r[3], "base_price_per_day": r[4],
            "difficulty": r[5], "category": r[6], "region": r[7],
        }
        for r in result.all()
    ]


def _build_system_prompt() -> str:
    dest_info = "\n".join(
        f"- {d['name']} ({d.get('region', 'Nepal')}): {d.get('category', '')}, "
        f"Difficulty: {d.get('difficulty', '')}, "
        f"Best season: {d.get('best_season', '')}, "
        f"~NPR {d.get('base_price_per_day', 3000):,}/day"
        for d in _destination_names
    )
    return f"""You are NepalGo AI, a friendly and knowledgeable Nepal-ONLY travel assistant.
You EXCLUSIVELY help users plan trips within Nepal — recommending destinations,
estimating budgets, suggesting itineraries, and answering questions about
Nepali culture, weather, and activities.

STRICT RULE: You ONLY assist with travel within Nepal. If a user asks about
ANY destination outside Nepal (e.g., India, Thailand, Europe, USA, Japan, or
any other country), you MUST politely decline and say: "I'm sorry, NepalGo is
exclusively for travel within Nepal! 🇳🇵 I can only help you explore the amazing
destinations Nepal has to offer. Would you like me to suggest some incredible
places in Nepal instead?" Do NOT provide any itineraries, budgets, or travel
advice for places outside Nepal under any circumstances.

Available destinations in our database:
{dest_info}

Guidelines:
- Be concise but helpful. Use bullet points for lists.
- When recommending destinations, mention the slug so the frontend can link to
  /destinations/{{slug}}
- For budget questions, give estimates in NPR (Nepali Rupees)
- Suggest using our trip planner for detailed itineraries
- Be enthusiastic about Nepal!
- If asked about something outside Nepal travel, politely redirect.
- Include 2-3 follow-up suggestions at the end of each response.
"""


_FOREIGN_PLACES = [
    "paris", "france", "london", "england", "uk", "united kingdom",
    "tokyo", "japan", "bangkok", "thailand", "dubai", "uae", "india",
    "delhi", "mumbai", "goa", "kerala", "bali", "indonesia", "singapore",
    "malaysia", "vietnam", "cambodia", "china", "beijing", "shanghai",
    "korea", "seoul", "australia", "sydney", "melbourne", "new york",
    "usa", "america", "canada", "toronto", "europe", "germany", "berlin",
    "spain", "barcelona", "madrid", "italy", "rome", "venice",
    "florence", "greece", "athens", "turkey", "istanbul", "egypt",
    "cairo", "brazil", "rio", "mexico", "maldives", "sri lanka",
    "colombo", "bhutan", "tibet", "lhasa", "russia", "moscow",
    "switzerland", "africa", "kenya", "south africa", "philippines",
    "manila", "taiwan", "hong kong", "macau", "portugal", "lisbon",
    travel_keywords = ["trip to", "visit", "travel to", "itinerary for", "plan for",
                       "go to", "fly to", "tour of", "budget for", "hotel in",
                       "things to do in", "places in", "best time to visit"]

    for place in _FOREIGN_PLACES:
        if place in msg_lower:
            # Check it's not referring to Nepal context (e.g., "I'm from India, want to visit Nepal")
            nepal_words = ["nepal", "kathmandu", "pokhara", "everest", "annapurna", "chitwan", "lumbini"]
            if any(nw in msg_lower for nw in nepal_words):
                return None  # Nepal is mentioned too, let AI handle it
            # Check if it's a travel intent
            if any(kw in msg_lower for kw in travel_keywords) or len(msg_lower.split()) <= 8:
                return {
                    "response": f"I appreciate your interest, but NepalGo is exclusively for travel within Nepal! 🇳🇵\n\n"
                                f"I can't help with destinations outside Nepal, but I'd love to help you discover "
                                f"the incredible places Nepal has to offer — from the Himalayas to jungle safaris, "
                                f"ancient temples to lakeside cities.\n\n"
                                f"Would you like me to suggest some amazing destinations in Nepal instead?",
                    "suggestions": [
                        "Recommend me a destination in Nepal",
                        "Best trekking spots in Nepal",
                        "Plan a trip to Pokhara",
                    ],
                }
    return None


async def process_chat(
    db: AsyncSession,
    message: str,
    conversation_history: list[dict] | None = None,
) -> dict:
    if not _destination_names:
        await load_destination_names(db)

    # Hard-coded filter: reject foreign destination requests
    foreign_response = _check_foreign_destination(message)
    if foreign_response:
        return foreign_response

    # Try Ollama first
    if OLLAMA_URL:
        try:
            return await _ollama_chat(message, conversation_history or [])
        except Exception as e:
            logger.warning(f"Ollama failed, falling back to keywords: {e}")

    # Fallback to keyword-based
    return _keyword_fallback(message)


async def _ollama_chat(message: str, history: list[dict]) -> dict:
    system_prompt = _build_system_prompt()

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-10:]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json={
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.7}
        })
        resp.raise_for_status()
        data = resp.json()

    response_text = data["message"]["content"]
    suggestions = _extract_suggestions(response_text, message)
    action = _extract_action(response_text)

    result = {"response": response_text, "suggestions": suggestions}
    if action:
        result["action"] = action
    return result


def _extract_suggestions(response: str, original_message: str) -> list[str]:
    """Try to extract follow-up suggestions from the AI response."""
    defaults = [
        "Tell me about popular destinations",
        "Help me plan a trip",
        "What's the best time to visit Nepal?",
    ]
    # Look for lines that look like suggestions
    lines = response.strip().split("\n")
    suggestions = []
    for line in lines[-5:]:
        cleaned = re.sub(r'^[\-\*\d\.]+\s*', '', line).strip()
        if cleaned and len(cleaned) < 80 and "?" in cleaned or cleaned.startswith("Plan") or cleaned.startswith("Tell"):
            suggestions.append(cleaned)
    return suggestions[:3] if suggestions else defaults


def _extract_action(response: str) -> dict | None:
    """Check if AI mentioned a destination we can link to."""
    for d in _destination_names:
        if d["name"].lower() in response.lower():
            return {
                "type": "redirect",
                "url": f"/destinations/{d['slug']}",
                "label": f"View {d['name']}",
            }
    return None


def _keyword_fallback(message: str) -> dict:
    """Original keyword-based fallback."""
    msg_lower = message.lower()
    matched_dest = _find_destination(msg_lower)
    intent = _detect_intent(msg_lower, matched_dest)

    if intent == "destination_info" and matched_dest:
        return _destination_info_response(matched_dest)
    if intent == "budget_query":
        return _budget_query_response(matched_dest, msg_lower)
    if intent == "plan_trip":
        return _plan_trip_response(matched_dest)
    if intent == "season_query":
        return _season_query_response(matched_dest)
    if intent == "recommendation":
        return _recommendation_response(msg_lower)
    if intent == "capabilities":
        return _capabilities_response()
    if intent == "activity_info_trekking":
        return _trekking_response()
    if intent == "activity_info_wildlife":
        return _wildlife_response()
    return _fallback_response()


# ── All existing keyword functions below (unchanged) ──

def _find_destination(msg_lower: str) -> dict | None:
    best_match = None
    best_len = 0
    for d in _destination_names:
        name_lower = d["name"].lower()
        if name_lower in msg_lower and len(name_lower) > best_len:
            best_match = d
            best_len = len(name_lower)
    return best_match


def _detect_intent(msg_lower: str, matched_dest) -> str:
    if matched_dest and not any(
        kw in msg_lower for kw in [
            "budget", "cost", "price", "plan", "trip", "best time",
            "when to visit", "season", "recommend", "suggest"
        ]
    ):
        return "destination_info"
    budget_kw = ["budget", "cost", "price", "how much", "npr", "expense"]
    if any(kw in msg_lower for kw in budget_kw):
        return "budget_query"
    plan_kw = ["plan", "trip", "itinerary", "generate", "create"]
    if any(kw in msg_lower for kw in plan_kw):
        return "plan_trip"
    season_kw = ["best time", "when to visit", "season", "weather", "month"]
    if any(kw in msg_lower for kw in season_kw):
        return "season_query"
    rec_kw = ["recommend", "suggest", "where should", "best place", "what to visit"]
    if any(kw in msg_lower for kw in rec_kw):
        return "recommendation"
    help_kw = ["help", "what can you do", "features", "how does"]
    if any(kw in msg_lower for kw in help_kw):
        return "capabilities"
    trek_kw = ["trekking", "hiking", "trek", "trail"]
    if any(kw in msg_lower for kw in trek_kw):
        return "activity_info_trekking"
    wild_kw = ["wildlife", "safari", "jungle", "animal"]
    if any(kw in msg_lower for kw in wild_kw):
        return "activity_info_wildlife"
    return "fallback"


def _destination_info_response(dest: dict) -> dict:
    price = dest.get("base_price_per_day") or 3000
    return {
        "response": (
            f"{dest['name']} is located in the {dest.get('region', 'Nepal')} region. "
            f"{dest.get('description', '')} "
            f"Best time to visit: {dest.get('best_season', 'Oct-Nov')}. "
            f"Difficulty: {dest.get('difficulty', 'Moderate')}. "
            f"Estimated cost: NPR {price:,} per day."
        ),
        "suggestions": [
            f"How much does a 5-day trip to {dest['name']} cost?",
            f"What is the best time to visit {dest['name']}?",
            f"Plan my {dest['name']} itinerary",
        ],
        "action": {"type": "redirect", "url": f"/destinations/{dest['slug']}", "label": f"View {dest['name']}"},
    }


def _budget_query_response(dest, msg_lower: str) -> dict:
    if dest:
        price = dest.get("base_price_per_day") or 3000
        days_match = re.search(r'(\d+)\s*(?:day|days)', msg_lower)
        days = int(days_match.group(1)) if days_match else 5
        estimate = price * days
        return {
            "response": (
                f"A {days}-day trip to {dest['name']} would cost approximately "
                f"NPR {estimate:,} to NPR {int(estimate * 1.5):,} depending on "
                f"your hotel choice and activities."
            ),
            "suggestions": [f"Plan a {days}-day trip to {dest['name']}", f"What activities are available in {dest['name']}?", "Show me budget-friendly destinations"],
            "action": {"type": "redirect", "url": f"/plan?destination={dest['slug']}", "label": "Start Planning"},
        }
    return {
        "response": "I can help you estimate your trip budget! Please tell me: 1) Which destination? 2) How many days? 3) Budget tier?",
        "suggestions": ["How much does a 5-day Pokhara trip cost?", "Budget for Everest Base Camp trek", "Cheap destinations in Nepal"],
    }


def _plan_trip_response(dest) -> dict:
    if dest:
        return {
            "response": f"Great choice! I can help you plan a trip to {dest['name']}. Head over to our trip planner!",
            "suggestions": [f"What's the best time to visit {dest['name']}?", f"How much does a trip to {dest['name']} cost?", f"Top activities in {dest['name']}"],
            "action": {"type": "redirect", "url": f"/plan?destination={dest['slug']}", "label": "Start Planning"},
        }
    return {
        "response": "I'd love to help you plan a trip! Where would you like to go?",
        "suggestions": ["Recommend me a destination", "Best trekking destinations", "Plan a trip to Pokhara"],
        "action": {"type": "redirect", "url": "/plan", "label": "Go to Trip Planner"},
    }


def _season_query_response(dest) -> dict:
    if dest:
        return {
            "response": f"The best time to visit {dest['name']} is {dest.get('best_season', 'October to November')}.",
            "suggestions": [f"Plan a trip to {dest['name']}", f"How much does a trip to {dest['name']} cost?", "Best destinations in spring"],
        }
    return {
        "response": "Nepal has two main tourist seasons: Autumn (Oct-Nov) and Spring (Mar-May).",
        "suggestions": ["Best trekking destinations in October", "Where to go in Nepal in spring", "Monsoon-friendly destinations"],
    }


def _recommendation_response(msg_lower: str) -> dict:
    return {
        "response": "I'd love to recommend destinations! Tell me your interests (Trekking, Culture, Wildlife, Nature).",
        "suggestions": ["Best places for trekking", "Cultural destinations in Nepal", "Wildlife destinations"],
        "action": {"type": "redirect", "url": "/destinations", "label": "Browse Destinations"},
    }


def _capabilities_response() -> dict:
    return {
        "response": "Here's what I can help with:\n🏔️ Destination Info\n💰 Budget Estimates\n📅 Trip Planning\n🌤️ Best Seasons\n🎯 Recommendations\n🥾 Activities",
        "suggestions": ["Recommend me a destination", "Plan a 5-day trip to Pokhara", "Best time to visit Nepal"],
    }


def _trekking_response() -> dict:
    trek_dests = [d for d in _destination_names if d.get("category") == "Adventure"][:3]
    names = ", ".join(d["name"] for d in trek_dests) or "Everest Base Camp, Annapurna Circuit, Langtang Valley"
    return {
        "response": f"Nepal is a trekker's paradise! Top destinations: {names}.",
        "suggestions": ["Best time for trekking", "Easy treks in Nepal", "Budget for Everest Base Camp"],
        "action": {"type": "redirect", "url": "/destinations?category=Adventure", "label": "View Trekking Destinations"},
    }


def _wildlife_response() -> dict:
    wild_dests = [d for d in _destination_names if d.get("category") == "Wildlife"][:3]
    names = ", ".join(d["name"] for d in wild_dests) or "Chitwan National Park, Bardia National Park"
    return {
        "response": f"Amazing wildlife spots: {names}. Spot tigers, rhinos, elephants! Best: Oct-Mar.",
        "suggestions": ["Plan a Chitwan safari", "Budget for wildlife tour", "Best time for jungle safari"],
        "action": {"type": "redirect", "url": "/destinations?category=Wildlife", "label": "View Wildlife Destinations"},
    }


def _fallback_response() -> dict:
    return {
        "response": "I'm your NepalGo travel assistant! Ask me about destinations, budgets, itineraries, or the best time to visit Nepal.",
        "suggestions": ["Tell me about Pokhara", "Plan a 5-day adventure trip", "What's the best time to visit Nepal?"],
    }
