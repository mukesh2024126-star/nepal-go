# NepalGo — Remaining Work Prompt

> Backend is fully working. Frontend is partially wired.
> This document covers ONLY what is still broken or missing.
> Do not re-do anything already working.

---

## What Is Already Done (Do Not Touch)

- All 22 backend API endpoints — fully working
- Auth flow: register, login, JWT, `/api/auth/me`
- Destinations list page — fetches from API, search works, skeletons work
- Destination detail page — fetches by slug, budget predictor works, reviews load
- Plan page — generates itinerary via API, save works, query params work
- Chat assistant — calls Ollama API, Nepal-only filter works
- Login and Register pages — fully wired, no fake data

---

## SECTION 1 — Dashboard (`app/dashboard/page.tsx`)

This is the only file with major remaining work. Fix all items below.

---

### 1.1 — User profile in sidebar

Call `authAPI.me()` on component mount. Replace every hardcoded instance
of "Raju Kumar", "raju@email.com", and the cluster badge with real data
from the API response. Show a skeleton placeholder in the sidebar while
the request is loading. If the request returns 401, call `router.push('/auth/login')`.

After getting the user, store `user.id` in state — it is needed for the
cluster profile fetch in section 1.5.

---

### 1.2 — Trip planner Step 4: replace fake generate with real API call

Currently "Generate My Itinerary" runs a fake 2.5 second timer and
shows the hardcoded `ITINERARY_DAYS` constant. Replace this entirely.

Across Steps 1 to 3 the user selects: destination, num_days, interests,
difficulty, travel_month, budget_tier, hotel_type. These values are
already in component state. When the user clicks Generate:

1. Set loading to true and show the existing spinner.
2. Call:
```ts
const result = await aiAPI.generateItinerary({
  destination_id,   // UUID — already fetched when destination is selected
  num_days,
  interests,        // string array
  difficulty,
  travel_month,
  budget_tier,
  hotel_type
})
```
3. Store the full `result` object in a `generatedItinerary` state variable.
4. Advance to Step 4 and render `result.schedule.days` in the accordion.
5. Show `result.predicted_budget` formatted as NPR in the budget display.
6. Show `result.budget_breakdown` (hotels, activities, transport, meals) in
   the budget split panel.
7. If the API call throws an error, stay on the loading step and show:
   "Itinerary generation failed. Please try again." with a Retry button.

Remove the hardcoded `ITINERARY_DAYS` constant entirely.

---

### 1.3 — Save itinerary

Currently `handleSaveItinerary()` creates a fake local object and prepends
it to state. Replace with:

```ts
const saved = await aiAPI.saveItinerary({
  ...generatedItinerary,
  destination_id,
  interests,
  difficulty,
  budget_tier,
  hotel_type
})
```

After success, call `userAPI.getItineraries()` and update the itineraries
state with the fresh list. Show a success toast "Trip saved successfully".
On failure show an error toast "Failed to save trip. Please try again."

---

### 1.4 — Regenerate button

Currently `handleRegenerate()` is fake. Replace with another call to
`aiAPI.generateItinerary()` using the exact same parameters as 1.2.
Update `generatedItinerary` state with the new result and re-render Step 4.

---

### 1.5 — Travel DNA chart

Currently uses the hardcoded `DNA_DATA` constant. Replace with real data.

After getting the user from `authAPI.me()`, call:
```ts
const profile = await clusterAPI.getProfile(user.id)
```

The response looks like:
```json
{
  "cluster_label": "Adventure Backpacker",
  "scores": { "adventure": 80, "cultural": 30, "nature": 60, "luxury": 10 }
}
```

Use `profile.scores.adventure`, `profile.scores.cultural`,
`profile.scores.nature`, `profile.scores.luxury` for the four
progress bar widths. Animate from 0 to the real value using the
existing animation logic.

Update the cluster badge in the sidebar with `profile.cluster_label`.

Remove the hardcoded `DNA_DATA` constant.

---

### 1.6 — Recommendations section

Currently shows hardcoded destination cards. Replace with:

After the user and cluster profile are loaded, call:
```ts
const recs = await aiAPI.recommend({
  interests: deriveInterestsFromTravelStyle(user.travel_style),
  difficulty: user.preferred_difficulty || 'Moderate',
  budget_tier: user.preferred_budget_tier || 'Mid-Range',
  travel_month: getCurrentMonthName(),  // e.g. 'March'
  num_days: 5
})
```

For `deriveInterestsFromTravelStyle`: map travel_style to a default
interests array, e.g. Adventure → ['Trekking', 'Hiking', 'Nature'],
Cultural → ['Temples', 'History', 'Local Cuisine'], etc.

For `getCurrentMonthName()`: `new Date().toLocaleString('default', { month: 'long' })`

Render `recs.recommendations.slice(0, 3)` as destination cards.
Each card shows `match_score` as a green badge and `match_reason` as
a subtitle. Show a loading skeleton while fetching.

---

### 1.7 — Stats cards

Currently stats are calculated from the hardcoded `INITIAL_TRIPS`.
After calling `userAPI.getItineraries()` on mount, compute stats
from the real returned array:

```ts
const trips_planned = itineraries.length
const days_explored = itineraries.reduce((sum, t) => sum + t.num_days, 0)
const total_budget = itineraries.reduce((sum, t) => sum + (t.predicted_budget || 0), 0)
```

For `destinations_saved`: call `savedAPI.getAll()` on mount and use
the returned array length.

Animate the numbers from 0 to their real values using the existing
`CountUpNumber` component.

---

### 1.8 — Saved Places tab

Currently shows the hardcoded `SAVED_DESTINATIONS` constant. When the
user clicks the Saved Places tab, if saved destinations have not yet
been fetched, call `savedAPI.getAll()`. Store results in state and
render real destination cards.

The "Unsave" button on each card should call `savedAPI.remove(destinationId)`,
remove the card from state on success, and decrement the saved count in stats.

Show a loading skeleton while fetching. Show "No saved places yet.
Browse destinations to save your favourites." if the array is empty.

Remove the hardcoded `SAVED_DESTINATIONS` constant.

---

### 1.9 — Reviews tab

Currently shows the hardcoded `MOCK_REVIEWS` constant.

Check if there is a `GET /api/reviews/user` or `GET /api/user/reviews`
endpoint on the backend. If it exists, call it and render the results.

If no user-reviews endpoint exists on the backend, do not show fake data.
Instead show: "Your reviews will appear here after you review destinations
you have visited." with a Browse Destinations button linking to `/destinations`.

Remove `MOCK_REVIEWS` entirely either way.

---

### 1.10 — Preferences tab

The save button currently only updates local state. Wire it to persist
to the backend:

Check if `userAPI.updatePreferences()` exists in `lib/api.ts`. If it does
not exist, add it:
```ts
updatePreferences: async (data: {
  travel_style?: string
  preferred_difficulty?: string
  preferred_budget_tier?: string
}) => fetchAPI('/api/user/preferences', {
  method: 'PATCH',
  body: JSON.stringify(data)
})
```

On save button click, call `userAPI.updatePreferences(formState)`.
On success: show a toast "Preferences saved", then re-call
`clusterAPI.getProfile(user.id)` and update the DNA chart and
cluster badge with the new values.
On failure: show error toast "Failed to save preferences."

---

### 1.11 — Logout button

The sidebar Logout button does nothing. Wire it:

```ts
const handleLogout = async () => {
  try { await authAPI.logout() } catch {}
  localStorage.removeItem('nepal_token')
  document.cookie = 'nepal_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  router.push('/auth/login')
}
```

---

### 1.12 — Budget split in current trip card

The "Your Current Trip" card shows hardcoded budget split rows
("Hotels NPR 13,500", etc.). If the current trip comes from the
`userAPI.getItineraries()` response, check if the itinerary object
has a `budget_breakdown` field. If it does, render those values.
If the field does not exist on older saved itineraries, hide the
budget split section rather than showing fake numbers.

---

## SECTION 2 — Destinations Page (`app/destinations/page.tsx`)

### 2.1 — Wire filters to API refetch

`DestinationFilters` already calls `onFilterChange(filters)` when the
user changes any filter. The parent page receives this via the prop
but does not act on it.

Add a `filters` state object and a `useEffect` that refetches when
either `filters` or the `search` query changes:

```ts
const [filters, setFilters] = useState({})
const [search, setSearch] = useState(searchParams.get('search') || '')

useEffect(() => {
  const load = async () => {
    setLoading(true)
    const result = await destinationsAPI.getAll({ ...filters, search })
    setDestinations(result.destinations)
    setTotal(result.total)
    setLoading(false)
  }
  load()
}, [filters, search])
```

Pass `setFilters` as the `onFilterChange` prop on `<DestinationFilters />`.

The existing loading skeleton should re-show while this refetch runs.
Add a `setLoading(true)` at the start of the effect and `setLoading(false)`
after the response arrives.

Also add a "Clear all filters" button that resets `filters` to `{}` and
`search` to `''`.

### 2.2 — Fix AI recommendation display

The "Get AI Recommendations" button already calls `aiAPI.recommend()` but
the response is not properly rendered. After the API responds, map
`result.recommendations` to destination cards. Each card should have a
green badge showing `match_score + '%'` and a small italic line showing
`match_reason` below the destination name.

---

## SECTION 3 — Homepage (`app/page.tsx`)

### 3.1 — Wire search bar to navigate

When the user submits the search form on the homepage hero section:

```ts
const handleSearch = (query: string) => {
  if (query.trim()) {
    router.push(`/destinations?search=${encodeURIComponent(query.trim())}`)
  }
}
```

Pass `handleSearch` as the `onSearch` or `onSubmit` prop to the SearchBar
component (or wire the form `onSubmit` directly if no prop exists).

### 3.2 — Add loading state to featured destinations

The featured destinations section fetches from `destinationsAPI.getFeatured()`
but has no loading state. While loading, show three placeholder skeleton
cards matching the existing card dimensions. Use the same skeleton style
already used on the destinations list page.

---

## SECTION 4 — Chat Assistant (`components/ChatAssistant.tsx`)

### 4.1 — Fix AI provider label

Change the subheading or badge in the chat panel header from
"Powered by Gemini" to "Powered by AI".

This is a one-line text change.

---

## SECTION 5 — Plan Page (`app/plan/page.tsx`)

### 5.1 — Show error when generation fails

Currently if `aiAPI.generateItinerary()` throws (e.g. Gemini is rate limited),
the page silently falls back to the hardcoded Everest itinerary. This is
misleading.

Replace the silent fallback with a visible error state:
- Show a red error banner: "Itinerary generation is temporarily unavailable.
  Please try again in a few minutes."
- Show a Retry button that re-calls the API.
- Do not display the hardcoded fallback itinerary. Remove it.

### 5.2 — Wire "Edit Preferences" button

The "Edit Preferences" button on the generated itinerary view does nothing.
Wire it to navigate back to Step 1 of the plan form on the same page,
preserving the destination but clearing the other selections so the user
can adjust them.

If the plan page is a single-step form (not multi-step), wire the button
to navigate to `/plan` with no query params so the user starts fresh.

---

## SECTION 6 — Images

### 6.1 — Use real image_url from API

Every destination card and hero currently uses a CSS gradient placeholder.
The backend returns an `image_url` field on every destination object.

In every place where a destination image is rendered, check if `image_url`
is a non-empty string. If it is, render it as a Next.js `<Image>` with
`fill`, `objectFit="cover"`, and `onError` fallback to the gradient.
If `image_url` is empty or null, keep the existing gradient placeholder.

This applies to:
- Destination cards on the homepage
- Destination cards on the list page
- The hero on the destination detail page
- Trip cards on the dashboard

---

## SECTION 7 — Minor Remaining Items

### 7.1 — Destination detail: activities and hotels from API

The detail page has hardcoded fallback arrays for activities and hotels.
Check the response from `destinationsAPI.getBySlug(slug)`. If the response
includes `activities` and `hotels` arrays, render those instead of the
hardcoded fallback. Only use the hardcoded fallback if the arrays are
absent from the API response.

### 7.2 — Destinations page: pagination

The `destinationsAPI.getAll()` response includes `total` and `total_pages`.
Add a simple pagination bar below the destination cards grid:
Previous button, page number buttons (show max 5 at a time), Next button.
Pass the current `page` as a query param to `destinationsAPI.getAll({ ...filters, page })`.
Scroll to the top of the destinations grid on page change.

### 7.3 — Contact form submission

The contact form on `/contact` currently has no submit handler. Add a
`handleSubmit` function that:
1. Validates all fields are filled.
2. Shows a loading state on the button.
3. Sends a `POST` request to `POST /api/contact` if that endpoint exists,
   or if it does not exist, simply shows a success message after a
   500ms delay without a real API call:
   "Thanks for reaching out! We will get back to you within 24 hours."
4. Resets the form after success.

---

## Summary: Files to Edit

| File | What changes |
|---|---|
| `app/dashboard/page.tsx` | Sections 1.1 through 1.12 — full rewire |
| `app/destinations/page.tsx` | Sections 2.1 and 2.2 — filters and recs |
| `app/page.tsx` | Sections 3.1 and 3.2 — search and skeleton |
| `components/ChatAssistant.tsx` | Section 4.1 — one-line text fix |
| `app/plan/page.tsx` | Sections 5.1 and 5.2 — error state and edit button |
| `lib/api.ts` | Add `userAPI.updatePreferences()` if missing |
| All destination image renders | Section 6.1 — use image_url |
| `app/destinations/[id]/page.tsx` | Section 7.1 — real activities/hotels |
| `app/destinations/page.tsx` | Section 7.2 — pagination |
| `app/contact/page.tsx` | Section 7.3 — form submit |

## Do Not Touch

- All backend files
- `lib/api.ts` existing functions (only add if missing)
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `components/ChatAssistant.tsx` (except the one-line label fix)
- Static pages: About, FAQ, Privacy, How It Works
