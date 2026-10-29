// Génère src/data/players.json à partir de scripts/players-source.ts.
// Les 6 stats sont dérivées de la note et d'un profil par poste, avec une variation
// déterministe (même entrée → même sortie).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SOURCE } from './players-source.ts';
import { COUNTRIES } from '../src/data/countries.ts';
import type { Player, Poste, Rarete } from '../src/game/types.ts';

const LEAGUES: Record<string, string> = {
  PL: 'Premier League',
  LL: 'LaLiga',
  SA: 'Serie A',
  BL: 'Bundesliga',
  L1: 'Ligue 1',
  LP: 'Liga Portugal',
  ED: 'Eredivisie',
  SPL: 'Saudi Pro League',
  TSL: 'Süper Lig',
  MLS: 'MLS',
  GRL: 'Super League Grèce',
};

const PROFILES: Record<Poste, number[]> = {
  //      plo/vit mai/tir deg/pas ref/dri vit/def pla/phy
  GK: [1, -3, -6, 2, -32, 0],
  DC: [-12, -35, -16, -20, 2, 0],
  DG: [3, -24, -6, -6, -5, -10],
  DD: [3, -24, -6, -6, -5, -10],
  MC: [-10, -6, 1, -2, -14, -6],
  AG: [5, -4, -6, 2, -48, -18],
  AD: [5, -4, -6, 2, -48, -18],
  BU: [-2, 3, -14, -6, -52, -2],
};

export function rareteOf(note: number): Rarete {
  if (note >= 87) return 'elite';
  if (note >= 82) return 'or';
  if (note >= 75) return 'argent';
  return 'bronze';
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[øØ]/g, 'o')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number) => Math.max(20, Math.min(99, Math.round(v)));

export function parseSource(source: string): Player[] {
  return source
    .trim()
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('//'))
    .map((line) => {
      const [nom, prenom, poste, sec, club, ligue, nat, age, note, valeur] = line.split('|');
      const country = COUNTRIES[nat];
      if (!country) throw new Error(`Nationalité inconnue « ${nat} » : ${line}`);
      if (!LEAGUES[ligue]) throw new Error(`Ligue inconnue « ${ligue} » : ${line}`);
      const p = poste as Poste;
      const n = Number(note);
      const id = slugify(`${prenom} ${nom}`);
      const h = hash(id);
      const v = PROFILES[p].map((off, i) => clamp(n + off + (((h >>> (i * 4)) & 0xf) % 9) - 4));
      const stats =
        p === 'GK'
          ? { plo: v[0], mai: v[1], deg: v[2], ref: v[3], vit: v[4], pla: v[5] }
          : { vit: v[0], tir: v[1], pas: v[2], dri: v[3], def: v[4], phy: v[5] };
      return {
        id,
        nom,
        prenom,
        poste: p,
        postesSecondaires: sec ? (sec.split(',') as Poste[]) : [],
        club,
        ligue: LEAGUES[ligue],
        nationalite: country.nom,
        age: Number(age),
        note: n,
        stats,
        valeurMarche: Number(valeur),
        rarete: rareteOf(n),
      };
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const players = parseSource(SOURCE);
  const out = '[\n' + players.map((p) => '  ' + JSON.stringify(p)).join(',\n') + '\n]\n';
  writeFileSync(new URL('../src/data/players.json', import.meta.url), out);
  console.log(`✔ ${players.length} joueurs écrits dans src/data/players.json`);
}
