import { displayName, getPlayer } from './db';
import { SLOT_POSTE } from './formation';
import { Rng } from './rng';
import type { AuctionResult, GameState, ParticipantIndex, Pick, Player, SlotId } from './types';

/** Écart de note maximal entre la carte mise aux enchères et le joueur mystère. */
export const MYSTERY_RANGE = 6;
/** Au-delà de ce nombre de doubles passes sur un même poste, chacun reçoit un joueur gratuit. */
export const MAX_DOUBLE_PASSES = 3;
export const LIVE_INCREMENTS = [5, 10, 50] as const;

export const currentSlot = (s: GameState): SlotId => s.config.slotOrder[s.slotIndex];

export const other = (p: ParticipantIndex): ParticipantIndex => (p === 0 ? 1 : 0);

function nextOrder(s: GameState, p: ParticipantIndex): number {
  return Object.keys(s.teams[p].lineup).length + 1;
}

export function assign(s: GameState, p: ParticipantIndex, slot: SlotId, pick: Omit<Pick, 'slot' | 'order'>): void {
  s.teams[p].lineup[slot] = { ...pick, slot, order: nextOrder(s, p) };
}

export function removeFromPool(s: GameState, id: string): void {
  s.pool = s.pool.filter((x) => x !== id);
}

/**
 * Tire un joueur du poste demandé, proche de la note cible. La fourchette s'élargit
 * si besoin (±6, ±10, tout le poste, puis les postes secondaires) pour ne jamais bloquer.
 */
export function drawNear(s: GameState, rng: Rng, slot: SlotId, target: number | null, exclude: string[] = []): string | null {
  const poste = SLOT_POSTE[slot];
  const pool = s.pool.filter((id) => !exclude.includes(id)).map(getPlayer);
  const primary = pool.filter((p) => p.poste === poste);
  const ranges = target === null ? [Infinity] : [MYSTERY_RANGE, 10, Infinity];
  for (const r of ranges) {
    const c = primary.filter((p) => target === null || Math.abs(p.note - target) <= r);
    if (c.length) return rng.pick(c).id;
  }
  const secondary = pool.filter((p) => p.postesSecondaires.includes(poste));
  if (secondary.length) return rng.pick(secondary).id;
  return pool.length ? rng.pick(pool).id : null;
}

/** Révèle une nouvelle carte pour le poste en cours — le mystère est tiré dans la foulée, avant tout affichage. */
export function startAuctionRound(s: GameState, rng: Rng, doublePasses = 0): void {
  const slot = currentSlot(s);
  const poste = SLOT_POSTE[slot];
  const candidates = s.pool.map(getPlayer).filter((p) => p.poste === poste);
  if (!candidates.length || doublePasses >= MAX_DOUBLE_PASSES) {
    giveFreePlayers(s, rng, slot, doublePasses);
    return;
  }
  const card = rng.pick(candidates);
  removeFromPool(s, card.id);
  const mysteryId = drawNear(s, rng, slot, card.note)!;
  removeFromPool(s, mysteryId);
  s.auction = {
    cardId: card.id,
    mysteryId,
    bids: [null, null],
    live: { high: 0, bidder: null },
    doublePasses,
    result: null,
  };
  s.phase = 'encheres';
}

/** Cas limite (trop de doubles passes ou poste épuisé) : chacun reçoit un joueur gratuit. */
function giveFreePlayers(s: GameState, rng: Rng, slot: SlotId, doublePasses: number): void {
  for (const p of [0, 1] as const) {
    const id = drawNear(s, rng, slot, null);
    if (!id) throw new Error('Plus aucun joueur disponible');
    removeFromPool(s, id);
    assign(s, p, slot, { playerId: id, price: 0, via: 'cadeau' });
    s.log.push({ kind: 'cadeau', text: `${s.participants[p].name} reçoit ${displayName(getPlayer(id))} gratuitement` });
  }
  s.auction = null;
  if (doublePasses >= MAX_DOUBLE_PASSES) {
    s.log.push({ kind: 'cadeau', text: `${MAX_DOUBLE_PASSES} doubles passes : joueurs offerts au poste ${SLOT_POSTE[slot]}` });
  }
  advanceAuctionSlot(s, rng);
}

export function advanceAuctionSlot(s: GameState, rng: Rng): void {
  s.slotIndex++;
  if (s.slotIndex >= s.config.slotOrder.length) {
    s.phase = 'termine';
    s.auction = null;
    return;
  }
  startAuctionRound(s, rng);
}

/** Somme, pour chaque poste restant après celui-ci, du prix minimum le plus bas disponible. */
export function budgetReserve(s: GameState): number {
  const auction = s.auction;
  const exclude = auction ? [auction.cardId, auction.mysteryId] : [];
  const pool = s.pool.filter((id) => !exclude.includes(id)).map(getPlayer);
  return s.config.slotOrder.slice(s.slotIndex + 1).reduce((sum, slot) => {
    const prices = pool.filter((p) => p.poste === SLOT_POSTE[slot]).map((p) => p.valeurMarche);
    return sum + (prices.length ? Math.min(...prices) : 0);
  }, 0);
}

/** Offre maximale autorisée par la règle de réserve de budget. */
export function maxPlayable(s: GameState, p: ParticipantIndex): number {
  return Math.max(0, s.teams[p].budget - budgetReserve(s));
}

export function minPrice(s: GameState): number {
  return s.auction ? getPlayer(s.auction.cardId).valeurMarche : 0;
}

export type BidCheck = { ok: true } | { ok: false; reason: string };

export function validateBid(s: GameState, p: ParticipantIndex, amount: number): BidCheck {
  if (s.phase !== 'encheres' || !s.auction) return { ok: false, reason: "Aucune enchère en cours." };
  if (amount === 0) return { ok: true };
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
    return { ok: false, reason: 'Offre invalide : saisis un nombre entier de M€.' };
  }
  const min = minPrice(s);
  if (amount < min) return { ok: false, reason: `L'offre doit être au moins égale au prix minimum (${min} M€).` };
  if (amount > s.teams[p].budget) return { ok: false, reason: `Budget insuffisant (${s.teams[p].budget} M€ restants).` };
  const max = maxPlayable(s, p);
  if (amount > max) {
    return {
      ok: false,
      reason: `Offre refusée : tu dois garder ${budgetReserve(s)} M€ pour les postes restants. Budget max jouable : ${max} M€.`,
    };
  }
  return { ok: true };
}

export function validateLiveBid(s: GameState, p: ParticipantIndex, amount: number): BidCheck {
  const base = validateBid(s, p, amount);
  if (!base.ok) return base;
  if (amount === 0) return { ok: false, reason: 'En direct, on passe en laissant filer le minuteur.' };
  const live = s.auction!.live;
  if (live.bidder === p) return { ok: false, reason: 'Tu as déjà la meilleure offre.' };
  if (live.bidder !== null && amount <= live.high) return { ok: false, reason: `Il faut dépasser ${live.high} M€.` };
  return { ok: true };
}

/** Résout une manche une fois les deux offres connues. */
export function resolveBids(s: GameState, rng: Rng, bids: [number, number]): void {
  const auction = s.auction!;
  const slot = currentSlot(s);
  if (bids[0] === 0 && bids[1] === 0) {
    const card = getPlayer(auction.cardId);
    s.log.push({ kind: 'double-passe', text: `Personne ne veut de ${displayName(card)} : carte retirée` });
    // Le mystère n'a jamais été montré : il retourne dans la pioche.
    s.pool.push(auction.mysteryId);
    startAuctionRound(s, rng, auction.doublePasses + 1);
    return;
  }
  let winner: ParticipantIndex;
  let tieBreak: AuctionResult['tieBreak'] = 'aucun';
  if (bids[0] !== bids[1]) winner = bids[0] > bids[1] ? 0 : 1;
  else if (s.teams[0].budget !== s.teams[1].budget) {
    winner = s.teams[0].budget > s.teams[1].budget ? 0 : 1;
    tieBreak = 'budget';
  } else {
    winner = rng.next() < 0.5 ? 0 : 1;
    tieBreak = 'tirage';
  }
  const loser = other(winner);
  const price = bids[winner];
  s.teams[winner].budget -= price;
  assign(s, winner, slot, { playerId: auction.cardId, price, via: 'enchere' });
  assign(s, loser, slot, { playerId: auction.mysteryId, price: 0, via: 'mystere' });
  auction.bids = bids;
  auction.result = {
    slot,
    cardId: auction.cardId,
    winner,
    price,
    bids,
    tieBreak,
    mysteryId: auction.mysteryId,
    jokerUsed: false,
  };
  s.phase = 'mystere';
  s.log.push({
    kind: 'adjuge',
    text: `Adjugé ! ${displayName(getPlayer(auction.cardId))} à ${s.participants[winner].name} pour ${price} M€`,
  });
}

export function canUseJoker(s: GameState): boolean {
  const r = s.auction?.result;
  return s.phase === 'mystere' && !!r && !r.jokerUsed && s.teams[other(r.winner)].jokers > 0;
}

export function applyJoker(s: GameState, rng: Rng): boolean {
  if (!canUseJoker(s)) return false;
  const r = s.auction!.result!;
  const loser = other(r.winner);
  const card: Player = getPlayer(r.cardId);
  const newId = drawNear(s, rng, r.slot, card.note, [r.mysteryId]);
  if (!newId) return false;
  removeFromPool(s, newId);
  s.pool.push(r.mysteryId);
  const old = s.teams[loser].lineup[r.slot]!;
  s.teams[loser].lineup[r.slot] = { ...old, playerId: newId, via: 'joker' };
  s.teams[loser].jokers--;
  r.firstMysteryId = r.mysteryId;
  r.mysteryId = newId;
  r.jokerUsed = true;
  s.auction!.mysteryId = newId;
  s.log.push({ kind: 'joker', text: `${s.participants[loser].name} utilise son joker : ${displayName(getPlayer(newId))}` });
  return true;
}
