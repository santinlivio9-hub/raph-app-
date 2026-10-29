import { advanceAuctionSlot, applyJoker, resolveBids, startAuctionRound, validateBid, validateLiveBid } from './auction';
import { PLAYERS } from './db';
import { dealOffer, draftPick, draftReroll } from './draft';
import { DEFAULT_ORDER } from './formation';
import { Rng } from './rng';
import type { GameConfig, GameState, Participant, ParticipantIndex, SlotId, TeamState } from './types';

/** Actions sérialisables : la même suite d'actions rejoue la même partie (prêt pour le jeu en ligne). */
export type GameAction =
  | { type: 'BID'; p: ParticipantIndex; amount: number }
  | { type: 'LIVE_BID'; p: ParticipantIndex; amount: number }
  | { type: 'LIVE_END' }
  | { type: 'USE_JOKER' }
  | { type: 'CONFIRM_MYSTERY' }
  | { type: 'DRAFT_PICK'; playerId: string }
  | { type: 'DRAFT_REROLL' };

export const DEFAULT_CONFIG: Omit<GameConfig, 'seed'> = {
  mode: 'enchere',
  startBudget: 1500,
  slotOrder: DEFAULT_ORDER,
  auctionType: 'aveugle',
  draftOffer: 'poste',
  draftReroll: true,
  timerSeconds: 10,
};

export function buildSlotOrder(random: boolean, seed: number): SlotId[] {
  return random ? new Rng(seed ^ 0x9e3779b9).shuffle(DEFAULT_ORDER) : [...DEFAULT_ORDER];
}

export function createGame(config: GameConfig, participants: [Participant, Participant], now = Date.now()): GameState {
  const team = (): TeamState => ({
    lineup: {},
    budget: config.mode === 'enchere' ? config.startBudget : 0,
    jokers: config.mode === 'enchere' ? 1 : 0,
    rerolls: config.mode === 'draft' && config.draftReroll ? 1 : 0,
  });
  const s: GameState = {
    id: `${now.toString(36)}-${config.seed.toString(36)}`,
    createdAt: now,
    config,
    participants,
    teams: [team(), team()],
    pool: PLAYERS.map((p) => p.id),
    rng: config.seed,
    slotIndex: 0,
    phase: config.mode === 'enchere' ? 'encheres' : 'draft',
    auction: null,
    draft: config.mode === 'draft' ? { pickIndex: 0, offer: [] } : null,
    log: [],
  };
  const rng = new Rng(s.rng);
  if (config.mode === 'enchere') startAuctionRound(s, rng);
  else dealOffer(s, rng);
  s.rng = rng.state;
  return s;
}

/** Reducer pur : renvoie un nouvel état (ou le même si l'action est invalide). */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.phase === 'termine') return state;
  const s = structuredClone(state);
  const rng = new Rng(s.rng);

  switch (action.type) {
    case 'BID': {
      if (s.config.auctionType !== 'aveugle' || !validateBid(s, action.p, action.amount).ok) return state;
      const bids = s.auction!.bids;
      if (bids[action.p] !== null) return state;
      bids[action.p] = action.amount;
      if (bids[0] !== null && bids[1] !== null) resolveBids(s, rng, [bids[0], bids[1]]);
      break;
    }
    case 'LIVE_BID': {
      if (s.config.auctionType !== 'direct' || !validateLiveBid(s, action.p, action.amount).ok) return state;
      s.auction!.live = { high: action.amount, bidder: action.p };
      break;
    }
    case 'LIVE_END': {
      if (s.phase !== 'encheres' || !s.auction) return state;
      const { high, bidder } = s.auction.live;
      const bids: [number, number] = [bidder === 0 ? high : 0, bidder === 1 ? high : 0];
      resolveBids(s, rng, bids);
      break;
    }
    case 'USE_JOKER':
      if (!applyJoker(s, rng)) return state;
      break;
    case 'CONFIRM_MYSTERY':
      if (s.phase !== 'mystere') return state;
      advanceAuctionSlot(s, rng);
      break;
    case 'DRAFT_PICK':
      if (!draftPick(s, rng, action.playerId)) return state;
      break;
    case 'DRAFT_REROLL':
      if (!draftReroll(s, rng)) return state;
      break;
  }
  s.rng = rng.state;
  return s;
}
