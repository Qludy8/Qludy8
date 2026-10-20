// Appels à l'API du serveur.
export class ApiError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
async function req(method, url, body) {
  let res;
  try {
    res = await fetch('/api' + url, {
      method, credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Le serveur ne répond pas. Vérifie ta connexion et réessaie.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || 'Une erreur est survenue.', data.code);
  return data;
}
export const api = {
  get: (u) => req('GET', u),
  post: (u, b = {}) => req('POST', u, b),
  del: (u) => req('DELETE', u),
};
