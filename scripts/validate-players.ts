// Vérifie la cohérence de src/data/players.json : champs, postes, doublons, bornes, notoriété,
// performances et répartition des niveaux de prix.
import { readFileSync } from 'node:fs';
import type { Player, Poste } from '../src/game/types.ts';
import { rareteOf } from './build-players.ts';

const POSTES: Poste[] = ['GK', 'DC', 'DG', 'DD', 'MC', 'AG', 'AD', 'BU'];
const MIN_PAR_POSTE = 35;
const MIN_TOTAL = 400;
const NOTORIETE_STANDARD = 3;

const players: Player[] = JSON.parse(readFileSync(new URL('../src/data/players.json', import.meta.url), 'utf8'));
const errors: string[] = [];
const err = (p: Player | undefined, msg: string) => errors.push(`${p ? `[${p.id}] ` : ''}${msg}`);
const int = (v: unknown, lo: number, hi: number) => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;

const ids = new Set<string>();
const qids = new Set<string>();
const identities = new Set<string>();

for (const p of players) {
  if (!p.id || !p.nom) err(p, 'id ou nom manquant');
  if (ids.has(p.id)) err(p, 'id en double');
  ids.add(p.id);
  const identity = `${p.prenom} ${p.nom}`.toLowerCase();
  if (identities.has(identity)) err(p, 'joueur en double (même nom)');
  identities.add(identity);
  if (p.wikidataId) {
    if (!/^Q\d+$/.test(p.wikidataId)) err(p, `wikidataId invalide ${p.wikidataId}`);
    if (qids.has(p.wikidataId)) err(p, `wikidataId en double ${p.wikidataId}`);
    qids.add(p.wikidataId);
  }

  if (!POSTES.includes(p.poste)) err(p, `poste invalide ${p.poste}`);
  for (const s of p.postesSecondaires) {
    if (!POSTES.includes(s)) err(p, `poste secondaire invalide ${s}`);
    if (s === p.poste) err(p, 'poste secondaire identique au poste principal');
  }
  if (!p.club || !p.competition || !p.nationalite) err(p, 'club, compétition ou nationalité manquant');
  if (!int(p.noteGenerale, 40, 99)) err(p, `note générale hors bornes (${p.noteGenerale})`);
  if (!int(p.age, 15, 45)) err(p, `âge hors bornes (${p.age})`);
  if (!int(p.notoriete, 1, 5)) err(p, `notoriété hors bornes (${p.notoriete})`);
  if (!(p.valeurMarche > 0 && p.valeurMarche <= 250)) err(p, `valeur marché hors bornes (${p.valeurMarche})`);
  if (p.rarete !== rareteOf(p.noteGenerale)) err(p, `rareté ${p.rarete} incohérente avec la note ${p.noteGenerale}`);

  const keys = p.poste === 'GK' ? ['plo', 'mai', 'deg', 'ref', 'vit', 'pla'] : ['vit', 'tir', 'pas', 'dri', 'def', 'phy'];
  const stats = p.stats as unknown as Record<string, number>;
  for (const k of keys) if (!int(stats[k], 1, 99)) err(p, `stat ${k} invalide (${stats[k]})`);
  if (Object.keys(stats).length !== 6) err(p, 'il faut exactement 6 stats');

  const f = p.perf;
  if (!f?.saison) err(p, 'perf.saison manquante');
  else {
    if (!int(f.matchs, 0, 60)) err(p, `perf.matchs hors bornes (${f.matchs})`);
    if (!int(f.minutes, 0, f.matchs * 120)) err(p, `perf.minutes incohérentes (${f.minutes} pour ${f.matchs} matchs)`);
    for (const k of ['buts', 'passesD', 'cleanSheets', 'arrets', 'tacles', 'interceptions'] as const) {
      if (!int(f[k], 0, 300)) err(p, `perf.${k} hors bornes (${f[k]})`);
    }
    if (f.cleanSheets > f.matchs) err(p, 'plus de clean sheets que de matchs');
    if (!(f.noteMoyenne >= 5 && f.noteMoyenne <= 10)) err(p, `perf.noteMoyenne hors bornes (${f.noteMoyenne})`);
  }
}

const standard = players.filter((p) => p.notoriete >= NOTORIETE_STANDARD);
const parPoste = Object.fromEntries(POSTES.map((po) => [po, standard.filter((p) => p.poste === po).length])) as Record<Poste, number>;
if (standard.length < MIN_TOTAL) err(undefined, `seulement ${standard.length} joueurs de notoriété ≥ ${NOTORIETE_STANDARD} (minimum ${MIN_TOTAL})`);
for (const poste of POSTES) {
  if (parPoste[poste] < MIN_PAR_POSTE) err(undefined, `poste ${poste} : ${parPoste[poste]} joueurs de notoriété ≥ 3 (minimum ${MIN_PAR_POSTE})`);
}

// Répartition des prix : on vise ~20 / 40 / 40 mais on reste fidèle aux vraies valeurs marché,
// où les joueurs à 80 M€ et plus sont rares : on exige seulement des proportions raisonnables.
const tier = (v: number) => (v >= 80 ? 'stars' : v >= 20 ? 'titulaires' : 'moyens');
const tiers = standard.reduce<Record<string, number>>((acc, p) => ((acc[tier(p.valeurMarche)] = (acc[tier(p.valeurMarche)] ?? 0) + 1), acc), {});
const pct = (k: string) => Math.round(((tiers[k] ?? 0) / standard.length) * 100);
if (pct('stars') < 5) err(undefined, `trop peu de stars (${pct('stars')} %)`);
if (pct('titulaires') < 30 || pct('titulaires') > 60) err(undefined, `part de titulaires anormale (${pct('titulaires')} %)`);
if (pct('moyens') < 30 || pct('moyens') > 55) err(undefined, `part de joueurs moyens anormale (${pct('moyens')} %)`);

console.log(`${players.length} joueurs (${standard.length} de notoriété ≥ 3) —`, POSTES.map((p) => `${p}:${parPoste[p]}`).join(' '));
console.log(`Prix : stars ≥ 80 M€ ${pct('stars')} % · titulaires 20–80 M€ ${pct('titulaires')} % · moyens < 20 M€ ${pct('moyens')} %`);
console.log(`Wikidata : ${players.filter((p) => p.wikidataId).length}/${players.length} identifiants`);

if (errors.length) {
  console.error(`✘ ${errors.length} erreur(s) :\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('✔ Base joueurs valide');
