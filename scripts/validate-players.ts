// Vérifie la cohérence de src/data/players.json : champs, postes, doublons, bornes, raretés.
import { readFileSync } from 'node:fs';
import type { Player, Poste } from '../src/game/types.ts';
import { rareteOf } from './build-players.ts';

const POSTES: Poste[] = ['GK', 'DC', 'DG', 'DD', 'MC', 'AG', 'AD', 'BU'];
const MIN_PAR_POSTE = 25;
const MIN_TOTAL = 300;

const players: Player[] = JSON.parse(readFileSync(new URL('../src/data/players.json', import.meta.url), 'utf8'));
const errors: string[] = [];
const err = (p: Player | undefined, msg: string) => errors.push(`${p ? `[${p.id}] ` : ''}${msg}`);

const ids = new Set<string>();
const identities = new Set<string>();
const parPoste = Object.fromEntries(POSTES.map((p) => [p, 0])) as Record<Poste, number>;

for (const p of players) {
  if (!p.id || !p.nom) err(p, 'id ou nom manquant');
  if (ids.has(p.id)) err(p, 'id en double');
  ids.add(p.id);
  const identity = `${p.prenom} ${p.nom}|${p.club}`.toLowerCase();
  if (identities.has(identity)) err(p, 'joueur en double (même nom et club)');
  identities.add(identity);

  if (!POSTES.includes(p.poste)) err(p, `poste invalide ${p.poste}`);
  else parPoste[p.poste]++;
  for (const s of p.postesSecondaires) {
    if (!POSTES.includes(s)) err(p, `poste secondaire invalide ${s}`);
    if (s === p.poste) err(p, 'poste secondaire identique au poste principal');
  }
  if (!p.club || !p.ligue || !p.nationalite) err(p, 'club, ligue ou nationalité manquant');
  if (!Number.isInteger(p.note) || p.note < 40 || p.note > 99) err(p, `note hors bornes (${p.note})`);
  if (!Number.isInteger(p.age) || p.age < 15 || p.age > 45) err(p, `âge hors bornes (${p.age})`);
  if (!(p.valeurMarche > 0 && p.valeurMarche <= 250)) err(p, `valeur marché hors bornes (${p.valeurMarche})`);
  if (p.rarete !== rareteOf(p.note)) err(p, `rareté ${p.rarete} incohérente avec la note ${p.note}`);

  const keys = p.poste === 'GK' ? ['plo', 'mai', 'deg', 'ref', 'vit', 'pla'] : ['vit', 'tir', 'pas', 'dri', 'def', 'phy'];
  const stats = p.stats as unknown as Record<string, number>;
  for (const k of keys) {
    const v = stats[k];
    if (!Number.isInteger(v) || v < 1 || v > 99) err(p, `stat ${k} invalide (${v})`);
  }
  if (Object.keys(stats).length !== 6) err(p, 'il faut exactement 6 stats');
}

if (players.length < MIN_TOTAL) err(undefined, `seulement ${players.length} joueurs (minimum ${MIN_TOTAL})`);
for (const poste of POSTES) {
  if (parPoste[poste] < MIN_PAR_POSTE) err(undefined, `poste ${poste} : ${parPoste[poste]} joueurs (minimum ${MIN_PAR_POSTE})`);
}

const rarity = players.reduce<Record<string, number>>((acc, p) => ((acc[p.rarete] = (acc[p.rarete] ?? 0) + 1), acc), {});
console.log(`${players.length} joueurs —`, POSTES.map((p) => `${p}:${parPoste[p]}`).join(' '));
console.log('Raretés :', rarity);

if (errors.length) {
  console.error(`✘ ${errors.length} erreur(s) :\n` + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('✔ Base joueurs valide');
