const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nepal_token');
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }
  return res.json();
}

export const authAPI = {
  register: (body: object) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body: object) => apiFetch('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()             => apiFetch('/api/auth/logout',   { method: 'POST' }),
  me:       ()             => apiFetch('/api/auth/me'),
};

export const destinationsAPI = {
  getAll: (params?: { search?: string; category?: string; region?: string; difficulty?: string; budget_max?: number; sort?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') query.set(k, String(v)); });
    }
    const qs = query.toString();
    return apiFetch(`/api/destinations${qs ? `?${qs}` : ''}`);
  },
  getBySlug: (slug: string) => apiFetch(`/api/destinations/${slug}`),
  getFeatured: () => apiFetch('/api/destinations/featured'),
};

export const aiAPI = {
  recommend:         (body: object) => apiFetch('/api/recommend',          { method: 'POST', body: JSON.stringify(body) }),
  predictBudget:     (body: object) => apiFetch('/api/budget/predict',     { method: 'POST', body: JSON.stringify(body) }),
  generateItinerary: (body: object) => apiFetch('/api/itinerary/generate', { method: 'POST', body: JSON.stringify(body) }),
  saveItinerary:     (body: object) => apiFetch('/api/itinerary/save',     { method: 'POST', body: JSON.stringify(body) }),
};

export const userAPI = {
  getItineraries:   ()             => apiFetch('/api/itinerary'),
  getItineraryById: (id: string)   => apiFetch(`/api/itinerary/${id}`),
  deleteItinerary:  (id: string)   => apiFetch(`/api/itinerary/${id}`, { method: 'DELETE' }),
  updateStatus:     (id: string, status: string) => apiFetch(`/api/itinerary/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getProfile:       ()             => apiFetch('/api/user/profile'),
  updatePreferences: (data: { travel_style?: string; preferred_difficulty?: string; preferred_budget_tier?: string }) =>
    apiFetch('/api/user/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const reviewsAPI = {
  getByDestination: (destId: string) => apiFetch(`/api/reviews/${destId}`),
  create:           (body: object)   => apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(body) }),
  delete:           (id: string)     => apiFetch(`/api/reviews/${id}`, { method: 'DELETE' }),
};

export const savedAPI = {
  getAll:  ()             => apiFetch('/api/saved'),
  save:    (body: object) => apiFetch('/api/saved', { method: 'POST', body: JSON.stringify(body) }),
  unsave:  (destId: string) => apiFetch(`/api/saved/${destId}`, { method: 'DELETE' }),
};

export const clusterAPI = {
  assign:     (body: object)    => apiFetch('/api/cluster/assign', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: (userId: string)  => apiFetch(`/api/cluster/profile/${userId}`),
};

export const chatAPI = {
  send: (body: { message: string; conversation_history?: Array<{role: string; content: string}> }) =>
    apiFetch('/api/chat', { method: 'POST', body: JSON.stringify(body) }),
};
