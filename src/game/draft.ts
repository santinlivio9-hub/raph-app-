import { assign, removeFromPool } from './auction';
import { displayName, getPlayer } from './db';
import { SLOT_POSTE } from './formation';
import { Rng } from './rng';
import type { GameState, ParticipantIndex, Player, SlotId } from './types';

export const OFFER_SIZE = 6;
export const TOTAL_PICKS = 22;

/** Ordre serpent : J1, J2, J2, J1, J1, J2… */
export function snakeTurn(pickIndex: number): ParticipantIndex {
  const round = Math.floor(pickIndex / 2);
  const first = round % 2 === 0 ? 0 : 1;
  return (pickIndex % 2 === 0 ? first : 1 - first) as ParticipantIndex;
}

export function draftTurn(s: GameState): ParticipantIndex {
  return snakeTurn(s.draft?.pickIndex ?? 0);
}

export function freeSlots(s: GameState, p: ParticipantIndex): SlotId[] {
  return s.config.slotOrder.filter((slot) => !s.teams[p].lineup[slot]);
}

/** Case où atterrit un joueur choisi : son poste principal si libre, sinon un poste secondaire libre. */
export function targetSlot(s: GameState, p: ParticipantIndex, player: Player): SlotId | null {
  const free = freeSlots(s, p);
  if (s.config.draftOffer === 'poste') return free[0] ?? null;
  return (
    free.find((slot) => SLOT_POSTE[slot] === player.poste) ??
    free.find((slot) => player.postesSecondaires.includes(SLOT_POSTE[slot])) ??
    null
  );
}

function eligible(s: GameState, p: ParticipantIndex, exclude: string[]): Player[] {
  const free = freeSlots(s, p);
  const pool = s.pool.filter((id) => !exclude.includes(id)).map(getPlayer);
  if (s.config.draftOffer === 'poste') {
    const poste = SLOT_POSTE[free[0]];
    return pool.filter((pl) => pl.poste === poste);
  }
  const postes = new Set(free.map((slot) => SLOT_POSTE[slot]));
  return pool.filter((pl) => postes.has(pl.poste) || pl.postesSecondaires.some((x) => postes.has(x)));
}

/** Tire 6 cartes. Elles restent dans la pioche tant qu'elles ne sont pas choisies. */
export function dealOffer(s: GameState, rng: Rng, exclude: string[] = []): void {
  const p = draftTurn(s);
  let cards = eligible(s, p, exclude);
  if (cards.length < OFFER_SIZE) cards = eligible(s, p, []);
  s.draft!.offer = rng.sample(cards, OFFER_SIZE).map((pl) => pl.id);
}

export function draftPick(s: GameState, rng: Rng, playerId: string): boolean {
  if (s.phase !== 'draft' || !s.draft || !s.draft.offer.includes(playerId)) return false;
  const p = draftTurn(s);
  const player = getPlayer(playerId);
  const slot = targetSlot(s, p, player);
  if (!slot) return false;
  removeFromPool(s, playerId);
  assign(s, p, slot, { playerId, price: 0, via: 'draft' });
  s.log.push({ kind: 'draft', text: `${s.participants[p].name} choisit ${displayName(player)}` });
  s.draft.pickIndex++;
  s.draft.offer = [];
  if (s.draft.pickIndex >= TOTAL_PICKS) s.phase = 'termine';
  else dealOffer(s, rng);
  return true;
}

export function canReroll(s: GameState): boolean {
  return s.phase === 'draft' && s.config.draftReroll && s.teams[draftTurn(s)].rerolls > 0;
}

export function draftReroll(s: GameState, rng: Rng): boolean {
  if (!canReroll(s)) return false;
  const p = draftTurn(s);
  s.teams[p].rerolls--;
  dealOffer(s, rng, s.draft!.offer);
  s.log.push({ kind: 'relance', text: `${s.participants[p].name} relance la pioche` });
  return true;
}
