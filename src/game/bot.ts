import { LIVE_INCREMENTS, currentSlot, maxPlayable, other, validateLiveBid } from './auction';
import { getPlayer } from './db';
import { canReroll, draftTurn, targetSlot } from './draft';
import { neighbours } from './formation';
import type { GameAction } from './game';
import { perfScore } from './performance';
import { effectiveNote, linkBetween } from './scoring';
import type { BotLevel, GameState, ParticipantIndex, Player, SlotId } from './types';

type Rand = () => number;

const between = (rand: Rand, a: number, b: number) => a + (b - a) * rand();

/** Bruit (en points de perf) sur l'estimation que le bot se fait d'un joueur. */
export const PERF_NOISE: Record<BotLevel, number> = { facile: 25, moyen: 12, difficile: 5 };

/** Qualité moyenne (0–1) des liens qu'aurait ce joueur avec ses voisins déjà en place. */
export function linkAffinity(s: GameState, p: ParticipantIndex, slot: SlotId, player: Player): number {
  const lineup = s.teams[p].lineup;
  const ns = neighbours(slot).filter((n) => lineup[n]);
  if (!ns.length) return 0;
  return ns.reduce((sum, n) => sum + linkBetween(player, getPlayer(lineup[n]!.playerId)).value, 0) / ns.length / 100;
}

/** Ce que le bot « pense » de la perf d'un joueur : la vraie valeur cachée, brouillée selon son niveau. */
export function estimatePerf(player: Player, slot: SlotId, level: BotLevel, rand: Rand): number {
  const n = PERF_NOISE[level];
  return Math.max(0, Math.min(100, perfScore(player, slot) + between(rand, -n, n)));
}

/** Montant maximal que le bot est prêt à payer pour la carte en cours (0 = il passe). */
export function botValuation(s: GameState, p: ParticipantIndex, level: BotLevel, rand: Rand = Math.random): number {
  if (!s.auction) return 0;
  const card = getPlayer(s.auction.cardId);
  const slot = currentSlot(s);
  const min = card.valeurMarche;
  const max = maxPlayable(s, p);
  if (min > max) return 0;
  const remaining = s.config.slotOrder.length - s.slotIndex;
  const perSlot = s.teams[p].budget / remaining;
  const est = estimatePerf(card, slot, level, rand);
  // Une perf de 60 « vaut » le budget moyen par poste ; au-dessus, ça grimpe vite.
  const linkBonus = level === 'facile' ? 0 : linkAffinity(s, p, slot, card) * (level === 'difficile' ? 0.4 : 0.2);
  const worth = perSlot * Math.pow(est / 60, 2.2) * (1 + linkBonus) * (level === 'facile' ? between(rand, 0.7, 1.5) : 1);
  if (worth < min) return level === 'facile' && rand() < 0.25 ? min : 0;
  return Math.min(max, Math.round(worth));
}

/** Offre secrète (enchères à l'aveugle). */
export function botBlindBid(s: GameState, p: ParticipantIndex, level: BotLevel, rand: Rand = Math.random): number {
  const valuation = botValuation(s, p, level, rand);
  if (valuation === 0) return 0;
  const min = getPlayer(s.auction!.cardId).valeurMarche;
  const shade = level === 'difficile' ? 0.6 : level === 'moyen' ? 0.8 : 1;
  return Math.max(min, Math.round(min + (valuation - min) * shade));
}

/** Prochaine surenchère du bot en direct, ou null s'il laisse filer. */
export function botLiveBid(s: GameState, p: ParticipantIndex, valuation: number): number | null {
  const a = s.auction;
  if (!a || a.live.bidder === p || valuation <= 0) return null;
  const min = getPlayer(a.cardId).valeurMarche;
  const step = a.live.high < 100 ? LIVE_INCREMENTS[0] : LIVE_INCREMENTS[1];
  const next = a.live.bidder === null ? min : a.live.high + step;
  if (next > valuation || !validateLiveBid(s, p, next).ok) return null;
  return next;
}

/** Le bot perdant tente le joker si son mystère lui paraît faible pour son prix. */
export function botWantsJoker(s: GameState, level: BotLevel, rand: Rand = Math.random): boolean {
  const r = s.auction?.result;
  if (!r) return false;
  const loser = other(r.winner);
  const mystery = getPlayer(r.mysteryId);
  const est = estimatePerf(mystery, r.slot, level, rand);
  if (level === 'facile') return rand() < 0.35;
  // Un mystère cher et décevant vaut d'être relancé (le prix est remboursé).
  const pricey = r.mysteryPrice > s.teams[loser].budget / Math.max(1, s.config.slotOrder.length - s.slotIndex);
  return est < 45 || (pricey && est < 58);
}

function draftScore(s: GameState, p: ParticipantIndex, id: string, level: BotLevel, rand: Rand): number {
  const player = getPlayer(id);
  const slot = targetSlot(s, p, player);
  if (!slot) return -Infinity;
  const linkWeight = level === 'difficile' ? 8 : level === 'moyen' ? 4 : 0;
  const noise = level === 'facile' ? between(rand, -5, 5) : level === 'moyen' ? between(rand, -1.5, 1.5) : 0;
  return effectiveNote(player, slot) + linkWeight * linkAffinity(s, p, slot, player) + noise;
}

/** Action de draft du bot : relance éventuelle, sinon meilleure carte pondérée par le collectif. */
export function botDraftAction(s: GameState, level: BotLevel, rand: Rand = Math.random): GameAction | null {
  if (s.phase !== 'draft' || !s.draft?.offer.length) return null;
  const p = draftTurn(s);
  const scored = s.draft.offer.map((id) => ({ id, score: draftScore(s, p, id, level, rand) }));
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  const bestNote = getPlayer(best.id).noteGenerale;
  const rerollUnder = level === 'difficile' ? 80 : level === 'moyen' ? 76 : 0;
  if (canReroll(s) && bestNote < rerollUnder) return { type: 'DRAFT_REROLL' };
  return { type: 'DRAFT_PICK', playerId: best.id };
}

/** Vote du bot au « Verdict des potes » : il croit en l'équipe qui a coûté le plus cher… sauf s'il est malin. */
export function botVote(s: GameState, p: ParticipantIndex, level: BotLevel): ParticipantIndex {
  if (level === 'difficile') return p;
  const spent = (i: ParticipantIndex) => s.config.startBudget - s.teams[i].budget;
  return spent(0) >= spent(1) ? 0 : 1;
}
