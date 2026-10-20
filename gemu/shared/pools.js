// Filtre des réserves de boosters, partagé serveur / navigateur.
export function matches(g, pool) {
  if (pool.yearMin && !(g.y >= pool.yearMin)) return false;
  if (pool.yearMax && !(g.y && g.y <= pool.yearMax)) return false;
  if (pool.genre && !g.g.includes(pool.genre)) return false;
  if (pool.platform) {
    if (pool.platform === 'retro') {
      if (!(g.pl === 'retro' || (g.pl === 'nintendo' && g.y < 2001))) return false;
    } else if (g.pl !== pool.platform) return false;
  }
  if (pool.saga && !g.sg) return false;
  if (pool.univers && g.u !== pool.univers) return false;
  return true;
}
