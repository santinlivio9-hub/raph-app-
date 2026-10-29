// Génère src/data/players.json à partir de scripts/players-source.ts.
// - Les 6 stats « carte » (Draft) sont dérivées de la note générale et d'un profil par poste.
// - Les volumes défensifs de `perf` (tacles, interceptions, arrêts) sont ESTIMÉS à partir du poste,
//   du niveau et du temps de jeu ; matchs, minutes, buts, passes, clean sheets et note moyenne sont saisis.
// - Les identifiants Wikidata viennent de scripts/wikidata-ids.json (rempli par `npm run data:photos`).
// Tout est déterministe : même entrée → même sortie.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PERF_SEASON, SOURCE } from './players-source.ts';
import { COUNTRIES } from '../src/data/countries.ts';
import type { Perf, Player, Poste, Rarete } from '../src/game/types.ts';

export const COMPETITIONS: Record<string, string> = {
  L1: 'Ligue 1',
  PL: 'Premier League',
  LIGA: 'Liga',
  SA: 'Serie A',
  BL: 'Bundesliga',
  SPL: 'Saudi Pro League',
  MLS: 'MLS',
  LP: 'Liga Portugal',
  TSL: 'Süper Lig',
  ED: 'Eredivisie',
  SPFL: 'Scottish Premiership',
  BRA: 'Brasileirão',
  ARG: 'Liga Profesional',
  MEX: 'Liga MX',
  QSL: 'Qatar Stars League',
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

/** Tacles et interceptions par 90 minutes (profil moyen par poste). */
const DEF_RATES: Record<Poste, [number, number]> = {
  GK: [0, 0],
  DC: [1.4, 1.5],
  DG: [1.8, 1.1],
  DD: [1.8, 1.1],
  MC: [2.0, 1.1],
  AG: [0.8, 0.4],
  AD: [0.8, 0.4],
  BU: [0.4, 0.2],
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
    .replace(/[ıİ]/g, 'i')
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

/** Variation déterministe dans [1 − amp, 1 + amp]. */
const jitter = (h: number, shift: number, amp: number) => 1 - amp + (((h >>> shift) & 0xff) / 255) * 2 * amp;

function estimatePerf(poste: Poste, note: number, h: number, raw: number[]): Perf {
  const [matchs, minutes, buts, passesD, cleanSheets, noteMoyenne] = raw;
  const nineties = minutes / 90;
  const level = 0.85 + (note - 75) / 60; // les meilleurs défendent un peu plus (et mieux placés)
  const [tac, int] = DEF_RATES[poste];
  const csRate = matchs ? cleanSheets / matchs : 0;
  return {
    saison: PERF_SEASON,
    matchs,
    minutes,
    buts,
    passesD,
    cleanSheets,
    arrets: poste === 'GK' ? Math.round(nineties * (3.4 - 2.2 * csRate) * jitter(h, 0, 0.15)) : 0,
    tacles: Math.round(nineties * tac * level * jitter(h, 8, 0.25)),
    interceptions: Math.round(nineties * int * level * jitter(h, 16, 0.25)),
    noteMoyenne,
  };
}

export function parseSource(source: string, wikidata: Record<string, string> = {}): Player[] {
  return source
    .trim()
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('//'))
    .map((line) => {
      const [nom, prenom, poste, sec, club, comp, nat, age, note, valeur, noto, perf] = line.split('|');
      const country = COUNTRIES[nat];
      if (!country) throw new Error(`Nationalité inconnue « ${nat} » : ${line}`);
      if (!COMPETITIONS[comp]) throw new Error(`Compétition inconnue « ${comp} » : ${line}`);
      const rawPerf = (perf ?? '').split(',').map(Number);
      if (rawPerf.length !== 6 || rawPerf.some((x) => Number.isNaN(x))) throw new Error(`perf invalide : ${line}`);
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
        competition: COMPETITIONS[comp],
        nationalite: country.nom,
        age: Number(age),
        valeurMarche: Number(valeur),
        noteGenerale: n,
        notoriete: Number(noto),
        wikidataId: wikidata[id] ?? null,
        stats,
        rarete: rareteOf(n),
        perf: estimatePerf(p, n, h, rawPerf),
      };
    });
}

export const WIKIDATA_IDS_FILE = new URL('./wikidata-ids.json', import.meta.url);

export function readWikidataIds(): Record<string, string> {
  return existsSync(WIKIDATA_IDS_FILE) ? JSON.parse(readFileSync(WIKIDATA_IDS_FILE, 'utf8')) : {};
}

export function writePlayers(players: Player[]): void {
  const out = '[\n' + players.map((p) => '  ' + JSON.stringify(p)).join(',\n') + '\n]\n';
  writeFileSync(new URL('../src/data/players.json', import.meta.url), out);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const players = parseSource(SOURCE, readWikidataIds());
  writePlayers(players);
  const withQ = players.filter((p) => p.wikidataId).length;
  console.log(`✔ ${players.length} joueurs écrits dans src/data/players.json (${withQ} avec identifiant Wikidata)`);
}
