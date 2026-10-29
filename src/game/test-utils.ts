import { DEFAULT_CONFIG, createGame } from './game';
import type { GameConfig, GameState, Participant } from './types';

export const HUMANS: [Participant, Participant] = [
  { name: 'Alice', color: '#3DFF8C', isBot: false },
  { name: 'Bob', color: '#F5C542', isBot: false },
];

export function newGame(overrides: Partial<GameConfig> = {}): GameState {
  return createGame({ ...DEFAULT_CONFIG, seed: 42, ...overrides }, HUMANS, 0);
}

/** Petit PRNG pour les décisions des bots dans les tests (déterministe). */
export function seededRand(seed: number): () => number {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}
