// Client HTTP minimal + état global du joueur connecté.
import { tr } from '/shared/i18n.js';
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new Error(tr(data?.error) || tr(`Erreur ${res.status}`));
  return data;
}
export const post = (path, body = {}) => api(path, { method: 'POST', body });

export const store = {
  me: null,
  listeners: new Set(),
  set(me) { this.me = me; this.listeners.forEach((f) => f(me)); },
  async refresh() { try { this.set(await api('/me')); } catch { /* hors-ligne */ } return this.me; },
  on(f) { this.listeners.add(f); return () => this.listeners.delete(f); },
};
