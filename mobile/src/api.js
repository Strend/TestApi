const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function j(url, options = {}) {
  const res = await fetch(`${API}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  quote(payload) {
    return j('/api/quote', { method: 'POST', body: JSON.stringify(payload) });
  },
  createRide(payload) {
    return j('/api/rides', { method: 'POST', body: JSON.stringify(payload) });
  },
  createPaymentIntent(rideId) {
    return j('/api/payments/intent', { method: 'POST', body: JSON.stringify({ rideId }) });
  }
};
