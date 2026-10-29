import { LIVE_INCREMENTS, currentSlot, maxPlayable, other, validateLiveBid } from './auction';
import { getPlayer } from './db';
import { canReroll, draftTurn, targetSlot } from './draft';
import { neighbours } from './formation';
import type { GameAction } from './game';
import { effectiveNote, linkBetween } from './scoring';
import type { BotLevel, GameState, ParticipantIndex, Player, SlotId } from './types';

type Rand = () => number;

const between = (rand: Rand, a: number, b: number) => a + (b - a) * rand();

/** Qualité moyenne (0–1) des liens qu'aurait ce joueur avec ses voisins déjà en place. */
export function linkAffinity(s: GameState, p: ParticipantIndex, slot: SlotId, player: Player): number {
  const lineup = s.teams[p].lineup;
  const ns = neighbours(slot).filter((n) => lineup[n]);
  if (!ns.length) return 0;
  return ns.reduce((sum, n) => sum + linkBetween(player, getPlayer(lineup[n]!.playerId)).value, 0) / ns.length / 100;
}

/** Montant maximal que le bot est prêt à payer pour la carte en cours (0 = il passe). */
export function botValuation(s: GameState, p: ParticipantIndex, level: BotLevel, rand: Rand = Math.random): number {
  if (!s.auction) return 0;
  const card = getPlayer(s.auction.cardId);
  const min = card.valeurMarche;
  const max = maxPlayable(s, p);
  if (min > max) return 0;
  const remaining = s.config.slotOrder.length - s.slotIndex;
  // Le bot malin garde 300 M€ pour décrocher le bonus budget maximal.
  const keep = level === 'difficile' ? 300 : level === 'moyen' ? 150 : 0;
  const perSlot = Math.max(0, s.teams[p].budget - keep) / remaining;
  const quality = (card.note - 80) / 10;
  const linkWeight = level === 'difficile' ? 0.6 : level === 'moyen' ? 0.3 : 0;
  const factor = 1 + quality * 0.9 + linkWeight * linkAffinity(s, p, currentSlot(s), card);
  const noise = level === 'facile' ? between(rand, 0.6, 1.6) : level === 'moyen' ? between(rand, 0.85, 1.2) : between(rand, 0.92, 1.08);
  const valuation = perSlot * Math.max(0.2, factor) * noise;
  if (valuation < min) return level === 'facile' && rand() < 0.3 ? min : 0;
  return Math.min(max, Math.round(valuation));
}

/** Offre secrète (enchères à l'aveugle). */
export function botBlindBid(s: GameState, p: ParticipantIndex, level: BotLevel, rand: Rand = Math.random): number {
  const valuation = botValuation(s, p, level, rand);
  if (valuation === 0) return 0;
  const min = getPlayer(s.auction!.cardId).valeurMarche;
  const shade = level === 'difficile' ? 0.7 : level === 'moyen' ? 0.85 : 1;
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

export function botWantsJoker(s: GameState, level: BotLevel, rand: Rand = Math.random): boolean {
  const r = s.auction?.result;
  if (!r) return false;
  const card = getPlayer(r.cardId);
  const mystery = getPlayer(r.mysteryId);
  const loser = other(r.winner);
  // Le bot difficile joue aussi sur le collectif : un mystère bien lié vaut plus que sa note.
  const affinity = level === 'difficile' ? linkAffinity(s, loser, r.slot, mystery) * 4 : 0;
  if (level === 'facile') return mystery.note < card.note && rand() < 0.5;
  const threshold = level === 'difficile' ? 2 : 3;
  return mystery.note + affinity < card.note - threshold;
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
  const bestNote = getPlayer(best.id).note;
  const rerollUnder = level === 'difficile' ? 80 : level === 'moyen' ? 76 : 0;
  if (canReroll(s) && bestNote < rerollUnder) return { type: 'DRAFT_REROLL' };
  return { type: 'DRAFT_PICK', playerId: best.id };
}
