import { getPlayer } from './db';
import { LINKS, SLOTS, SLOT_POSTE, neighbours } from './formation';
import type { GameMode, Pick, Player, SlotId, TeamState } from './types';

export const SCORE_WEIGHTS = { note: 0.7, collectif: 0.3 } as const;
export const PENALTY_SECONDARY = 2;
export const PENALTY_OUT_OF_POSITION = 8;

export type LinkStrength = 'fort' | 'moyen' | 'faible' | 'aucun';

/** Valeur (0–100) d'un lien selon ce que partagent deux joueurs voisins. */
export const LINK_VALUE: Record<LinkStrength, number> = { fort: 100, moyen: 65, faible: 40, aucun: 10 };
/** Bonus quand nationalité ET ligue sont partagées (sans être du même club). */
export const NAT_AND_LEAGUE_BONUS = 10;

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

export function effectiveNote(player: Player, slot: SlotId): number {
  return player.note - positionPenalty(player, slot);
}

export function linkBetween(p: Player, q: Player): { strength: LinkStrength; value: number } {
  if (p.club === q.club) return { strength: 'fort', value: LINK_VALUE.fort };
  const nat = p.nationalite === q.nationalite;
  const league = p.ligue === q.ligue;
  if (nat) return { strength: 'moyen', value: LINK_VALUE.moyen + (league ? NAT_AND_LEAGUE_BONUS : 0) };
  if (league) return { strength: 'faible', value: LINK_VALUE.faible };
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

/** Bonus budget (Enchères) : +1 par tranche de 100 M€ restante, plafonné à +3. */
export function budgetBonus(budget: number): number {
  return Math.min(3, Math.floor(Math.max(0, budget) / 100));
}

export interface TeamScore {
  noteGenerale: number;
  collectif: number;
  bonusBudget: number;
  total: number;
  links: Link[];
  complete: boolean;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

export function computeTeamScore(team: TeamState, mode: GameMode): TeamScore {
  const picks = SLOTS.flatMap((s) => (team.lineup[s] ? [[s, team.lineup[s]!] as const] : []));
  const noteGenerale = picks.length
    ? picks.reduce((sum, [slot, pick]) => sum + effectiveNote(getPlayer(pick.playerId), slot), 0) / picks.length
    : 0;
  const links = teamLinks(team.lineup);
  // Le collectif se mesure sur les 18 liens du schéma : un lien manquant compte 0.
  const collectif = links.reduce((sum, l) => sum + l.value, 0) / LINKS.length;
  const bonusBudget = mode === 'enchere' ? budgetBonus(team.budget) : 0;
  const total = SCORE_WEIGHTS.note * noteGenerale + SCORE_WEIGHTS.collectif * collectif + bonusBudget;
  return {
    noteGenerale: round2(noteGenerale),
    collectif: round2(collectif),
    bonusBudget,
    total: round2(total),
    links,
    complete: picks.length === SLOTS.length,
  };
}

export type Outcome = { winner: 0 | 1 | null; reason: 'score' | 'note' | 'nul' };

/** Vainqueur officiel : meilleur score total, puis meilleure note générale, sinon nul. */
export function decideWinner(a: TeamScore, b: TeamScore): Outcome {
  if (a.total !== b.total) return { winner: a.total > b.total ? 0 : 1, reason: 'score' };
  if (a.noteGenerale !== b.noteGenerale) return { winner: a.noteGenerale > b.noteGenerale ? 0 : 1, reason: 'note' };
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
}

function picksOf(team: TeamState): Pick[] {
  return SLOTS.flatMap((s) => (team.lineup[s] ? [team.lineup[s]!] : []));
}

/** Score « impact » d'un joueur : note effective + jusqu'à +5 selon la qualité de ses liens. */
export function playerImpact(team: TeamState, pick: Pick): number {
  const player = getPlayer(pick.playerId);
  const ns = neighbours(pick.slot).filter((s) => team.lineup[s]);
  const linkAvg = ns.length
    ? ns.reduce((sum, s) => sum + linkBetween(player, getPlayer(team.lineup[s]!.playerId)).value, 0) / ns.length
    : 0;
  return effectiveNote(player, pick.slot) + linkAvg / 20;
}

export function teamHighlights(team: TeamState, mode: GameMode): TeamHighlights {
  const picks = picksOf(team);
  if (!picks.length) return { mvp: null, affaire: null, flop: null };
  const withPlayer = picks.map((pick) => ({ pick, player: getPlayer(pick.playerId) }));

  const best = <T>(items: T[], score: (t: T) => number) => items.reduce((a, b) => (score(b) > score(a) ? b : a));

  const mvpItem = best(withPlayer, (x) => playerImpact(team, x.pick));
  const mvp = { ...mvpItem, detail: `Note ${mvpItem.player.note} · le plus influent du onze` };

  if (mode === 'enchere') {
    // Meilleure affaire : plus grande plus-value (valeur marché − prix payé).
    const gain = (x: (typeof withPlayer)[number]) => x.player.valeurMarche - x.pick.price + x.player.note / 1000;
    const a = best(withPlayer, gain);
    const affaire = {
      ...a,
      detail:
        a.pick.price === 0
          ? `Note ${a.player.note} obtenu gratuitement (valeur ${a.player.valeurMarche} M€)`
          : `Note ${a.player.note} payé ${a.pick.price} M€ (valeur ${a.player.valeurMarche} M€)`,
    };
    // Plus gros flop : le joueur payé le plus cher par point de note.
    const bought = withPlayer.filter((x) => x.pick.price > 0);
    const f = bought.length ? best(bought, (x) => x.pick.price / x.player.note + (x.pick.price - x.player.valeurMarche) / 100) : null;
    const flop = f ? { ...f, detail: `${f.pick.price} M€ pour une note de ${f.player.note} (valeur ${f.player.valeurMarche} M€)` } : null;
    return { mvp, affaire, flop };
  }

  // Draft : on compare la note au rang du choix (une grosse note tardive est une affaire).
  const draftValue = (x: (typeof withPlayer)[number]) => x.player.note + x.pick.order * 0.8;
  const a = best(withPlayer, draftValue);
  const f = best(withPlayer, (x) => -draftValue(x));
  return {
    mvp,
    affaire: { ...a, detail: `Note ${a.player.note} au choix n°${a.pick.order}` },
    flop: f === a ? null : { ...f, detail: `Note ${f.player.note} au choix n°${f.pick.order}` },
  };
}
