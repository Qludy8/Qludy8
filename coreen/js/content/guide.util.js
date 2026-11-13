// Leçons bilingues : les textes sont écrits une seule fois sous la forme B(français, anglais),
// les exemples dans la langue apprise ne sont pas répétés.
//   { p: B(…) } · { tip: B(…) } · { table: [[cellule…]] } (cellule : texte commun ou B(…))
//   { ex: [[phrase, B(traduction), prononciation ou lecture ?], …] }

export const B = (fr, en) => ({ fr, en });

const pick = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v.fr : v);

/** Transforme des leçons bilingues en leçons d'une seule langue, au format de guide.js. */
export function localize(lessons, lang) {
  return lessons.map((g) => ({
    ...g,
    title: pick(g.title, lang),
    sum: pick(g.sum, lang),
    blocks: g.blocks.map((b) => {
      if (b.p) return { p: pick(b.p, lang) };
      if (b.tip) return { tip: pick(b.tip, lang) };
      if (b.table) return { table: b.table.map((row) => row.map((c) => pick(c, lang))) };
      if (b.ex) return { ex: b.ex.map(([tl, tr, pr]) => (pr ? [tl, pick(tr, lang), pr] : [tl, pick(tr, lang)])) };
      return b;
    }),
  }));
}

/**
 * Range les leçons par rubriques : sections = { catégorie: [{ title: B(…), ids: [...] }] }.
 * La première leçon de chaque rubrique porte son titre (sec) ; les leçons hors rubrique gardent leur place à la suite.
 */
export function arrange(lessons, sections, lang) {
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const used = new Set();
  const out = [];
  for (const secs of Object.values(sections)) {
    for (const s of secs) {
      let first = true;
      for (const id of s.ids) {
        const l = byId.get(id);
        if (!l) continue;
        out.push(first ? { ...l, sec: pick(s.title, lang) } : l);
        used.add(id);
        first = false;
      }
    }
  }
  return [...out, ...lessons.filter((l) => !used.has(l.id))];
}
