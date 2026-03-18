# NepalGo — Full Project Report

## Project Overview
NepalGo is an AI-powered Nepal tourism web application with a Next.js 16 frontend and FastAPI + PostgreSQL backend. It features AI chat (Ollama/Gemini), itinerary generation, budget prediction, destination recommendations, and user clustering.

## Project Structure
```
/Desktop/NepalGo/
├── frontend/          (Next.js 16 + React 19 + TypeScript + Tailwind v4)
├── backend/           (FastAPI + SQLAlchemy + Alembic + PostgreSQL)
├── start.sh           (Launch script)
└── Start NepalGo.command  (Double-click launcher for Mac)
```

---

## BACKEND (FastAPI on port 8080)

### API Endpoints (all working)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/auth/register` | POST | User registration | ✅ Working |
| `/api/auth/login` | POST | JWT login | ✅ Working |
| `/api/auth/logout` | POST | Logout | ✅ Working |
| `/api/auth/me` | GET | Current user profile | ✅ Working |
| `/api/destinations` | GET | List all destinations (search, filter, sort) | ✅ Working |
| `/api/destinations/featured` | GET | Featured destinations | ✅ Working |
| `/api/destinations/{slug}` | GET | Single destination by slug | ✅ Working |
| `/api/recommend` | POST | AI destination recommendations | ✅ Working |
| `/api/budget/predict` | POST | AI budget prediction | ✅ Working |
| `/api/itinerary/generate` | POST | AI itinerary generation (Gemini-powered) | ✅ Working |
| `/api/itinerary/save` | POST | Save generated itinerary | ✅ Working |
| `/api/itinerary` | GET | User's saved itineraries | ✅ Working |
| `/api/itinerary/{id}` | DELETE | Delete itinerary | ✅ Working |
| `/api/itinerary/{id}/status` | PATCH | Update itinerary status | ✅ Working |
| `/api/reviews` | POST | Create review | ✅ Working |
| `/api/reviews/{dest_id}` | GET | Reviews for destination | ✅ Working |
| `/api/reviews/{id}` | DELETE | Delete review | ✅ Working |
| `/api/saved` | GET/POST | Saved destinations | ✅ Working |
| `/api/saved/{dest_id}` | DELETE | Unsave destination | ✅ Working |
| `/api/cluster/assign` | POST | Assign user to travel cluster | ✅ Working |
| `/api/cluster/profile/{user_id}` | GET | Get cluster profile | ✅ Working |
| `/api/chat` | POST | AI chat (Ollama with keyword fallback) | ✅ Working |

### Backend Tech
- FastAPI + async SQLAlchemy + asyncpg
- PostgreSQL database (`nepalgo`)
- Alembic migrations
- JWT authentication
- Chat: Ollama (llama3.2:1b) with keyword fallback + Nepal-only filter (blocks foreign destinations)
- Itinerary generation uses Gemini API (key in .env but currently rate-limited)
- CORS enabled for localhost:3000

### Backend .env
```
DATABASE_URL=postgresql+asyncpg://mukeshbista:password@localhost:5432/nepalgo
SECRET_KEY=supersecretkey123
GEMINI_API_KEY=AIzaSyDpE69z7pJ4z1cohhgEzD42wI0OtAPLvm0
```

---

## FRONTEND (Next.js on port 3000)

### Pages & Their Current State

#### 1. Homepage (`app/page.tsx`) — ⚠️ PARTIALLY DYNAMIC
- **What works:** Hero section, search bar, stats with animated CountUpNumber, testimonials, CTA
- **What's dynamic:** Popular destinations section fetches from `destinationsAPI.getFeatured()` with hardcoded fallback
- **What's still hardcoded:** Stats numbers (15000+ travelers, 50+ destinations, etc.), testimonials, "How it Works" section
- **What's missing:**
  - SearchBar doesn't navigate to `/destinations` with query params on submit
  - Stats should pull from a real stats endpoint
  - No loading state for featured destinations section

#### 2. Destinations List (`app/destinations/page.tsx`) — ⚠️ PARTIALLY DYNAMIC
- **What works:** Fetches destinations from API on mount, search works, loading skeletons
- **What's still hardcoded:** AI recommendation section shuffles random hardcoded names instead of calling `aiAPI.recommend()`
- **What's missing:**
  - Filters sidebar (`DestinationFilters`) doesn't trigger API refetch — it was updated to pass filter state to parent, but the parent doesn't use it to call `destinationsAPI.getAll(filterParams)`
  - AI recommendation button calls API but response isn't properly displayed
  - No pagination

#### 3. Destination Detail (`app/destinations/[id]/page.tsx`) — ✅ MOSTLY DYNAMIC
- **What works:** Fetches destination by slug, displays name/region/description/difficulty/rating from API, budget predictor calls `aiAPI.predictBudget()`, reviews fetched from API
- **Has fallback data** for activities, hotels, reviews if API fails
- **What's missing:**
  - Image: No real images — uses gradient placeholders everywhere
  - Activities and hotels don't come from the API response (backend may not return them)
  - "Plan This Trip" button links to `/plan?destination=slug` ✅

#### 4. Plan/Itinerary (`app/plan/page.tsx`) — ✅ MOSTLY DYNAMIC
- **What works:** Reads query params (destination, days, budget_tier, hotel_type, interests, travel_month), fetches destination UUID by slug, calls `aiAPI.generateItinerary()`, loading spinner, save button calls `aiAPI.saveItinerary()`
- **Has fallback** 5-day Everest itinerary if API fails
- **What's missing:**
  - "Edit Preferences" button does nothing
  - No way to regenerate with different params from this page
  - If backend itinerary generation fails (Gemini rate limited), falls back to hardcoded data silently

#### 5. Dashboard (`app/dashboard/page.tsx`) — 🔴 MOSTLY HARDCODED (BIGGEST ISSUE)
This is ~700 lines and the most complex page. Here's the breakdown:

**What's dynamic (API calls exist):**
- User itineraries fetched via `userAPI.getItineraries()` on mount (falls back to INITIAL_TRIPS)
- Cluster/Travel DNA fetched via `clusterAPI.assign()` on mount
- Delete trip calls `userAPI.deleteItinerary()`

**What's STILL HARDCODED (needs fixing):**
- **User profile** — "Raju Kumar" / "raju@email.com" hardcoded in sidebar. Should fetch from `authAPI.me()` and show real user data
- **Stats** (Trips Planned, Days Explored, Total Budget, Destinations Saved) — calculated from hardcoded INITIAL_TRIPS, not from API data
- **Travel DNA chart** — DNA_DATA is hardcoded `[['adventure', 90], ['cultural', 55], ...]`. Should come from cluster API response
- **Recommendations** — "Recommended For You" section is hardcoded. Should call `aiAPI.recommend()` based on user interests
- **Saved Places tab** — Uses hardcoded SAVED_DESTINATIONS. Should call `savedAPI.getAll()` on tab switch
- **Reviews tab** — Uses hardcoded MOCK_REVIEWS. Should call a user reviews endpoint
- **Trip Planner Step 4** — "Generate My Itinerary" does NOT call the API. It just shows a fake spinner for 2.5 seconds then displays hardcoded ITINERARY_DAYS. Should call `aiAPI.generateItinerary()` with the collected form data
- **Save Itinerary** — `handleSaveItinerary()` creates a local TripData object and prepends to state. Should call `aiAPI.saveItinerary()` and then refetch
- **Regenerate** — `handleRegenerate()` is fake (just shows spinner). Should call API again
- **Budget Split** in current trip card is hardcoded ("Hotels NPR 13,500" etc.)
- **Preferences tab** — Save button doesn't persist to backend

#### 6. Chat Assistant (`components/ChatAssistant.tsx`) — ✅ FULLY DYNAMIC
- **What works:** Calls `chatAPI.send()` with message and conversation history, displays AI response with suggestions and action buttons, typing indicator, navigation via action buttons
- **Small issue:** Header says "Powered by Gemini" but actually uses Ollama now
- **Nepal-only filter** works on backend side

#### 7. Login (`app/auth/login/page.tsx`) — ✅ FULLY DYNAMIC
- Calls `authAPI.login()`, stores JWT token in localStorage + cookie, redirects to dashboard
- No more mock login fallback
- Error handling works

#### 8. Register (`app/auth/register/page.tsx`) — ✅ FULLY DYNAMIC
- Calls `authAPI.register()`, redirects to login on success
- Password strength meter, travel style selector
- Error handling works

#### 9. Static Pages — ✅ NO CHANGES NEEDED
- About, Contact, FAQ, Privacy, How It Works — all server-rendered static content

### Frontend API Client (`lib/api.ts`) — ✅ PROPERLY CONFIGURED
- All endpoints correctly mapped to backend routes
- JWT token auto-attached from localStorage
- Proper error handling (throws with `detail` message)
- Includes: authAPI, destinationsAPI, aiAPI, userAPI, reviewsAPI, savedAPI, clusterAPI, chatAPI

---

## CRITICAL ISSUES TO FIX (Priority Order)

### 🔴 P0 — Dashboard is mostly fake
1. **User profile in sidebar** — Fetch from `authAPI.me()` instead of hardcoded "Raju Kumar"
2. **Trip Planner Step 4** — MUST call `aiAPI.generateItinerary()` with collected form data (destination_id, num_days, interests, difficulty, budget_tier, hotel_type, travel_month) instead of fake spinner + hardcoded ITINERARY_DAYS
3. **Save Itinerary** — Call `aiAPI.saveItinerary()` with the generated data, then refetch itineraries
4. **Regenerate** — Call `aiAPI.generateItinerary()` again
5. **Saved Places tab** — Fetch from `savedAPI.getAll()` instead of hardcoded SAVED_DESTINATIONS
6. **Reviews tab** — Fetch user's reviews from API
7. **Recommendations** — Call `aiAPI.recommend()` with user interests
8. **Travel DNA** — Use actual cluster API response data for the chart bars
9. **Stats** — Calculate from real itinerary data

### 🟡 P1 — Destinations page filters don't work
- DestinationFilters component passes filter state to parent via `onFilterChange`
- But the destinations page doesn't use those filters to refetch from API
- Need to wire: `onFilterChange → setFilters → destinationsAPI.getAll(filters)`

### 🟡 P1 — Homepage search bar not wired
- SearchBar component exists but doesn't navigate to `/destinations?search=...` on submit
- Should redirect with query params

### 🟡 P1 — Chat header says "Gemini" but uses Ollama
- Update ChatAssistant header text from "Powered by Gemini" to "Powered by AI" or "Powered by Ollama"

### 🟢 P2 — No real images anywhere
- All destination cards, heroes, and trip cards use CSS gradient placeholders
- Backend has `image_url` field on destinations — could serve real images

### 🟢 P2 — No logout functionality
- Dashboard sidebar has a Logout button but it just sits there
- Should call `authAPI.logout()`, clear localStorage/cookies, redirect to login

### 🟢 P2 — Preferences don't persist
- Preferences tab (travel style, budget tier, difficulty) only updates local state
- Should save to backend user profile

### 🟢 P3 — No pagination on destinations
### 🟢 P3 — No loading states on some tab switches in dashboard
### 🟢 P3 — Contact form doesn't submit anywhere

---

## WHAT'S WORKING END-TO-END RIGHT NOW
1. ✅ User can register → login → get JWT token
2. ✅ Destinations list loads from API
3. ✅ Individual destination detail loads from API by slug
4. ✅ Budget predictor calls AI and shows result
5. ✅ Plan page generates itinerary via AI (when Gemini quota available, otherwise falls back)
6. ✅ Chat assistant responds with Ollama AI + Nepal-only filter blocks foreign destinations
7. ✅ Backend is fully functional with all endpoints
8. ✅ PostgreSQL database with migrations

## WHAT LOOKS WORKING BUT IS FAKE
1. ❌ Dashboard trip planner "Generate Itinerary" — fake spinner, hardcoded result
2. ❌ Dashboard save itinerary — local state only
3. ❌ Dashboard user profile — hardcoded "Raju Kumar"
4. ❌ Dashboard stats — hardcoded numbers
5. ❌ Dashboard saved places — hardcoded list
6. ❌ Dashboard reviews — hardcoded list
7. ❌ Dashboard recommendations — hardcoded list
8. ❌ Dashboard Travel DNA — hardcoded percentages
9. ❌ Destination filters — UI exists but doesn't filter

---

## TECH STACK SUMMARY
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide icons
- **Backend:** FastAPI, SQLAlchemy (async), PostgreSQL, Alembic, JWT auth
- **AI:** Ollama (llama3.2:1b) for chat, Gemini API for itinerary generation
- **Fonts:** DM Sans + Plus Jakarta Sans
- **Design:** Green (#22C55E) accent, pill buttons, rounded cards, purple background (#F0EBF8)

---

## INSTRUCTIONS FOR NEXT AI ASSISTANT
Please fix the dashboard page (`app/dashboard/page.tsx`) as the top priority. It's the most complex page (~700 lines) and almost entirely uses hardcoded data despite having API calls available. The `lib/api.ts` already has all the correct endpoints. The backend is fully functional. You just need to wire the frontend to actually USE the APIs instead of fake data.

Key APIs to wire in dashboard:
- `authAPI.me()` → user profile sidebar
- `aiAPI.generateItinerary({...})` → Step 4 of trip planner
- `aiAPI.saveItinerary({...})` → Save button
- `savedAPI.getAll()` → Saved Places tab
- `aiAPI.recommend({...})` → Recommendations section
- `clusterAPI.getProfile(userId)` → Travel DNA chart data
- Real stats calculation from fetched itineraries

After dashboard, fix: destination filters wiring, homepage search navigation, logout functionality.
