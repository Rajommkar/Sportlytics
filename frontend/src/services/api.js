const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  getHealth: () => request("/health"),
  getTournaments: () => request("/tournaments"),
  createTournament: (payload) =>
    request("/tournaments", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getMatches: () => request("/matches"),
  getMatch: (matchId) => request(`/matches/${matchId}`),
  createMatch: (payload) =>
    request("/matches", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  startInnings: (matchId, payload) =>
    request(`/matches/${matchId}/innings/start`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  addDelivery: (matchId, inningsId, payload) =>
    request(`/matches/${matchId}/innings/${inningsId}/deliveries`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
