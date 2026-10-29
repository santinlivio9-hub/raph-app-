import { getPlayer } from './db';
import { LINKS, SLOTS, SLOT_POSTE, neighbours } from './formation';
import { perfScore } from './performance';
import type { GameConfig, Pick, Player, SlotId, TeamState } from './types';

/** Draft : 70 % note générale + 30 % collectif. */
export const DRAFT_WEIGHTS = { note: 0.7, collectif: 0.3 } as const;
export const PENALTY_SECONDARY = 2;
export const PENALTY_OUT_OF_POSITION = 8;

export type LinkStrength = 'fort' | 'moyen' | 'faible' | 'aucun';

/** Valeur (0–100) d'un lien selon ce que partagent deux joueurs voisins. */
export const LINK_VALUE: Record<LinkStrength, number> = { fort: 100, moyen: 65, faible: 40, aucun: 10 };
/** Bonus quand nationalité ET compétition sont partagées (sans être du même club). */
export const NAT_AND_COMPETITION_BONUS = 10;

export interface Link {
  a: SlotId;
  b: SlotId;
  strength: LinkStrength;
  value: number;
}

export function positionPenalty(player: Player, slot: SlotId): number {
  const poste = SLOT_POSTE[slot];
  if (player.poste === poste) return 0;
  if (player.postesSecondaires.includes(poste)) return PENALTY_SECONDARY;
  return PENALTY_OUT_OF_POSITION;
}

/** Note générale effective (Draft), pénalité de poste incluse. */
export function effectiveNote(player: Player, slot: SlotId): number {
  return player.noteGenerale - positionPenalty(player, slot);
}

export function linkBetween(p: Player, q: Player): { strength: LinkStrength; value: number } {
  if (p.club === q.club) return { strength: 'fort', value: LINK_VALUE.fort };
  const nat = p.nationalite === q.nationalite;
  const comp = p.competition === q.competition;
  if (nat) return { strength: 'moyen', value: LINK_VALUE.moyen + (comp ? NAT_AND_COMPETITION_BONUS : 0) };
  if (comp) return { strength: 'faible', value: LINK_VALUE.faible };
  return { strength: 'aucun', value: LINK_VALUE.aucun };
}

export function teamLinks(lineup: TeamState['lineup']): Link[] {
  const links: Link[] = [];
  for (const [a, b] of LINKS) {
    const pa = lineup[a];
    const pb = lineup[b];
    if (!pa || !pb) continue;
    links.push({ a, b, ...linkBetween(getPlayer(pa.playerId), getPlayer(pb.playerId)) });
  }
  return links;
}

export interface TeamScore {
  /** Moyenne des scores de performance (Enchères) — toujours calculée, affichable en Draft. */
  perfMoyenne: number;
  /** Moyenne des notes générales effectives (Draft). */
  noteGenerale: number;
  collectif: number;
  total: number;
  /** Poids de la composante principale (perf en Enchères, note en Draft). */
  weight: number;
  links: Link[];
  complete: boolean;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

type ScoreConfig = { mode: GameConfig['mode']; perfWeight: number };

export function computeTeamScore(team: TeamState, config: ScoreConfig): TeamScore {
  const picks = SLOTS.flatMap((s) => (team.lineup[s] ? [[s, getPlayer(team.lineup[s]!.playerId)] as const] : []));
  const avg = (f: (slot: SlotId, p: Player) => number) => (picks.length ? picks.reduce((sum, [s, p]) => sum + f(s, p), 0) / picks.length : 0);
  const perfMoyenne = avg((s, p) => perfScore(p, s));
  const noteGenerale = avg((s, p) => effectiveNote(p, s));
  const links = teamLinks(team.lineup);
  // Le collectif se mesure sur les 18 liens du schéma : un lien manquant compte 0.
  const collectif = links.reduce((sum, l) => sum + l.value, 0) / LINKS.length;
  const weight = config.mode === 'enchere' ? config.perfWeight : DRAFT_WEIGHTS.note;
  const main = config.mode === 'enchere' ? perfMoyenne : noteGenerale;
  return {
    perfMoyenne: round2(perfMoyenne),
    noteGenerale: round2(noteGenerale),
    collectif: round2(collectif),
    total: round2(weight * main + (1 - weight) * collectif),
    weight,
    links,
    complete: picks.length === SLOTS.length,
  };
}

export type Outcome = { winner: 0 | 1 | null; reason: 'score' | 'departage' | 'nul' };

/** Vainqueur officiel : meilleur score, puis meilleure composante principale (perf ou note), sinon nul. */
export function decideWinner(a: TeamScore, b: TeamScore, mode: GameConfig['mode']): Outcome {
  if (a.total !== b.total) return { winner: a.total > b.total ? 0 : 1, reason: 'score' };
  const key = mode === 'enchere' ? 'perfMoyenne' : 'noteGenerale';
  if (a[key] !== b[key]) return { winner: a[key] > b[key] ? 0 : 1, reason: 'departage' };
  return { winner: null, reason: 'nul' };
}

export interface Highlight {
  pick: Pick;
  player: Player;
  detail: string;
}

export interface TeamHighlights {
  mvp: Highlight | null;
  affaire: Highlight | null;
  flop: Highlight | null;
  /** Mystère le plus chanceux (Enchères uniquement). */
  chanceux: Highlight | null;
}

function picksOf(team: TeamState): Pick[] {
  return SLOTS.flatMap((s) => (team.lineup[s] ? [team.lineup[s]!] : []));
}

/** Impact d'un joueur dans son onze : sa valeur principale + jusqu'à +5 selon la qualité de ses liens. */
export function playerImpact(team: TeamState, pick: Pick, mode: GameConfig['mode']): number {
  const player = getPlayer(pick.playerId);
  const ns = neighbours(pick.slot).filter((s) => team.lineup[s]);
  const linkAvg = ns.length ? ns.reduce((sum, s) => sum + linkBetween(player, getPlayer(team.lineup[s]!.playerId)).value, 0) / ns.length : 0;
  const main = mode === 'enchere' ? perfScore(player, pick.slot) : effectiveNote(player, pick.slot);
  return main + linkAvg / 20;
}

const MYSTERY_VIAS = new Set(['mystere', 'joker', 'cadeau', 'brade']);
const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace('.', ',');

export function teamHighlights(team: TeamState, mode: GameConfig['mode']): TeamHighlights {
  const picks = picksOf(team);
  if (!picks.length) return { mvp: null, affaire: null, flop: null, chanceux: null };
  const items = picks.map((pick) => ({ pick, player: getPlayer(pick.playerId), perf: perfScore(getPlayer(pick.playerId), pick.slot) }));
  type Item = (typeof items)[number];
  const best = (xs: Item[], score: (t: Item) => number) => xs.reduce((a, b) => (score(b) > score(a) ? b : a));
  const strip = ({ pick, player }: Item, detail: string): Highlight => ({ pick, player, detail });

  const mvpItem = best(items, (x) => playerImpact(team, x.pick, mode));
  const mvp = strip(
    mvpItem,
    mode === 'enchere' ? `Perf ${fmt(mvpItem.perf)}/100 · le plus influent du onze` : `Note ${mvpItem.player.noteGenerale} · le plus influent du onze`,
  );

  if (mode === 'enchere') {
    // Perf par M€ dépensé (au moins 1 M€ pour éviter les divisions par zéro).
    const ratio = (x: Item) => x.perf / Math.max(1, x.pick.price);
    const a = best(items, ratio);
    const paid = items.filter((x) => x.pick.price >= 5);
    const f = paid.length ? best(paid, (x) => -ratio(x)) : null;
    const mysteries = items.filter((x) => MYSTERY_VIAS.has(x.pick.via));
    const c = mysteries.length ? best(mysteries, (x) => x.perf) : null;
    return {
      mvp,
      affaire: strip(a, `Perf ${fmt(a.perf)} pour ${a.pick.price} M€ (${fmt(ratio(a))} pt/M€)`),
      flop: f && f !== a ? strip(f, `Perf ${fmt(f.perf)} pour ${f.pick.price} M€ (${fmt(ratio(f))} pt/M€)`) : null,
      chanceux: c ? strip(c, `Mystère payé ${c.pick.price} M€ · perf ${fmt(c.perf)}/100`) : null,
    };
  }

  // Draft : on compare la note au rang du choix (une grosse note choisie tard est une affaire).
  const draftValue = (x: Item) => x.player.noteGenerale + x.pick.order * 0.8;
  const a = best(items, draftValue);
  const f = best(items, (x) => -draftValue(x));
  return {
    mvp,
    affaire: strip(a, `Note ${a.player.noteGenerale} au choix n°${a.pick.order}`),
    flop: f === a ? null : strip(f, `Note ${f.player.noteGenerale} au choix n°${f.pick.order}`),
    chanceux: null,
  };
}
