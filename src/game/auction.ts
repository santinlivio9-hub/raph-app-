import { displayName, getPlayer } from './db';
import { SLOT_POSTE } from './formation';
import { Rng } from './rng';
import type { AuctionResult, GameState, ParticipantIndex, Pick, Player, SlotId } from './types';

/** Au-delà de ce nombre de doubles passes sur un même poste, chacun reçoit son mystère d'office. */
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

/** Ids réservés pour la manche en cours (carte + mystères) : ils ne comptent pas comme disponibles. */
function reserved(s: GameState): string[] {
  return s.auction ? [s.auction.cardId, ...s.auction.mysteries] : [];
}

/**
 * Réserve obligatoire : pour chaque poste restant APRÈS celui en cours, le prix du joueur
 * le moins cher encore disponible à ce poste.
 */
export function budgetReserve(s: GameState, exclude: string[] = reserved(s)): number {
  const pool = s.pool.filter((id) => !exclude.includes(id)).map(getPlayer);
  return s.config.slotOrder.slice(s.slotIndex + 1).reduce((sum, slot) => {
    const prices = pool.filter((p) => p.poste === SLOT_POSTE[slot]).map((p) => p.valeurMarche);
    return sum + (prices.length ? Math.min(...prices) : 0);
  }, 0);
}

/** Montant maximal que ce participant peut engager sur la case en cours (offre ou mystère). */
export function maxPlayable(s: GameState, p: ParticipantIndex, exclude?: string[]): number {
  return Math.max(0, s.teams[p].budget - budgetReserve(s, exclude));
}

/**
 * Tire le mystère d'un participant : même poste, prix laissant de quoi compléter son onze.
 * Tirage uniforme parmi les joueurs abordables → une affaire comme un joueur cher.
 * Si rien n'est abordable : le joueur le moins cher du poste (cas limite, voir `mysteryPrice`).
 */
export function drawMystery(s: GameState, rng: Rng, p: ParticipantIndex, slot: SlotId, exclude: string[], budgetDelta = 0): string | null {
  const poste = SLOT_POSTE[slot];
  const candidates = s.pool.filter((id) => !exclude.includes(id)).map(getPlayer).filter((pl) => pl.poste === poste);
  if (!candidates.length) {
    const secondary = s.pool.filter((id) => !exclude.includes(id)).map(getPlayer).filter((pl) => pl.postesSecondaires.includes(poste));
    return secondary.length ? cheapest(secondary).id : null;
  }
  const cap = s.teams[p].budget + budgetDelta - budgetReserve(s, exclude);
  const affordable = candidates.filter((pl) => pl.valeurMarche <= cap);
  return (affordable.length ? rng.pick(affordable) : cheapest(candidates)).id;
}

const cheapest = (ps: Player[]) => ps.reduce((a, b) => (b.valeurMarche < a.valeurMarche ? b : a));

/** Prix réellement payé pour un mystère : sa valeur marché, ou ce qu'il reste de payable s'il est trop cher. */
export function mysteryPrice(s: GameState, p: ParticipantIndex, id: string, exclude: string[]): number {
  const value = getPlayer(id).valeurMarche;
  return Math.min(value, maxPlayable(s, p, exclude));
}

/** Nouvelle manche : les deux mystères sont tirés en secret, puis la carte est révélée. */
export function startAuctionRound(s: GameState, rng: Rng, doublePasses = 0): void {
  const slot = currentSlot(s);
  const poste = SLOT_POSTE[slot];
  s.auction = null;
  const candidates = s.pool.map(getPlayer).filter((p) => p.poste === poste);
  if (candidates.length < 3 || doublePasses >= MAX_DOUBLE_PASSES) {
    forceMysteries(s, rng, slot, doublePasses);
    return;
  }
  // Tirage de la carte d'abord (pour l'exclure), mais les mystères sont fixés avant toute révélation.
  const card = rng.pick(candidates);
  const m0 = drawMystery(s, rng, 0, slot, [card.id])!;
  const m1 = drawMystery(s, rng, 1, slot, [card.id, m0])!;
  for (const id of [card.id, m0, m1]) removeFromPool(s, id);
  s.auction = {
    cardId: card.id,
    mysteries: [m0, m1],
    bids: [null, null],
    live: { high: 0, bidder: null },
    doublePasses,
    result: null,
  };
  s.phase = 'encheres';
}

/** Cas limite (doubles passes répétées ou poste épuisé) : chacun reçoit et paie un mystère. */
function forceMysteries(s: GameState, rng: Rng, slot: SlotId, doublePasses: number): void {
  for (const p of [0, 1] as const) {
    const id = drawMystery(s, rng, p, slot, []);
    if (!id) throw new Error('Plus aucun joueur disponible');
    const price = mysteryPrice(s, p, id, [id]);
    removeFromPool(s, id);
    s.teams[p].budget -= price;
    assign(s, p, slot, { playerId: id, price, via: 'cadeau' });
    s.log.push({ kind: 'cadeau', text: `${s.participants[p].name} reçoit d'office ${displayName(getPlayer(id))} (${price} M€)` });
  }
  if (doublePasses >= MAX_DOUBLE_PASSES) {
    s.log.push({ kind: 'cadeau', text: `${MAX_DOUBLE_PASSES} doubles passes : chacun reçoit son joueur mystère au poste ${SLOT_POSTE[slot]}` });
  }
  advanceAuctionSlot(s, rng);
}

export function advanceAuctionSlot(s: GameState, rng: Rng): void {
  s.slotIndex++;
  s.auction = null;
  if (s.slotIndex >= s.config.slotOrder.length) {
    s.phase = 'termine';
    return;
  }
  startAuctionRound(s, rng);
}

export function minPrice(s: GameState): number {
  return s.auction ? getPlayer(s.auction.cardId).valeurMarche : 0;
}

export type BidCheck = { ok: true } | { ok: false; reason: string };

export function validateBid(s: GameState, p: ParticipantIndex, amount: number): BidCheck {
  if (s.phase !== 'encheres' || !s.auction) return { ok: false, reason: 'Aucune enchère en cours.' };
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
      reason: `Offre refusée : tu dois garder ${budgetReserve(s)} M€ pour payer les postes restants. Max jouable : ${max} M€.`,
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
    // Les mystères n'ont jamais été montrés : ils retournent dans la pioche (de nouveaux seront tirés).
    s.pool.push(...auction.mysteries);
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
  const mysteryId = auction.mysteries[loser];
  const mPrice = mysteryPrice(s, loser, mysteryId, [mysteryId]);
  s.teams[winner].budget -= price;
  s.teams[loser].budget -= mPrice;
  assign(s, winner, slot, { playerId: auction.cardId, price, via: 'enchere' });
  assign(s, loser, slot, { playerId: mysteryId, price: mPrice, via: mPrice < getPlayer(mysteryId).valeurMarche ? 'brade' : 'mystere' });
  // Le mystère du gagnant n'a pas servi : retour discret dans la pioche.
  s.pool.push(auction.mysteries[winner]);
  auction.bids = bids;
  auction.result = { slot, cardId: auction.cardId, winner, price, bids, tieBreak, mysteryId, mysteryPrice: mPrice, jokerUsed: false };
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

/** Joker : le perdant est remboursé du premier mystère et paie la valeur du nouveau (qu'il garde). */
export function applyJoker(s: GameState, rng: Rng): boolean {
  if (!canUseJoker(s)) return false;
  const r = s.auction!.result!;
  const loser = other(r.winner);
  const team = s.teams[loser];
  team.budget += r.mysteryPrice;
  const newId = drawMystery(s, rng, loser, r.slot, [r.mysteryId]);
  if (!newId) {
    team.budget -= r.mysteryPrice;
    return false;
  }
  removeFromPool(s, newId);
  const newPrice = mysteryPrice(s, loser, newId, []);
  team.budget -= newPrice;
  s.pool.push(r.mysteryId);
  team.lineup[r.slot] = { ...team.lineup[r.slot]!, playerId: newId, price: newPrice, via: 'joker' };
  team.jokers--;
  r.firstMysteryId = r.mysteryId;
  r.firstMysteryPrice = r.mysteryPrice;
  r.mysteryId = newId;
  r.mysteryPrice = newPrice;
  r.jokerUsed = true;
  s.log.push({ kind: 'joker', text: `${s.participants[loser].name} utilise son joker : ${displayName(getPlayer(newId))} (${newPrice} M€)` });
  return true;
}
