import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PLAYERS } from '../game/db';
import { type GameAction, createGame, gameReducer } from '../game/game';
import type { GameConfig, GameState, Participant } from '../game/types';
import { safeStorage } from '../lib/storage';

export type Screen = 'home' | 'setup' | 'game' | 'result' | 'history' | 'settings' | 'tutorial' | 'credits';

interface GameStore {
  screen: Screen;
  /** Écran de configuration ouvert en mode solo (contre le bot). */
  setupSolo: boolean;
  game: GameState | null;
  go: (screen: Screen) => void;
  openSetup: (solo: boolean) => void;
  start: (config: GameConfig, participants: [Participant, Participant]) => void;
  dispatch: (action: GameAction) => void;
  quit: () => void;
}

export const useGame = create<GameStore>()(
  persist(
    (set) => ({
      screen: 'home',
      setupSolo: false,
      game: null,
      go: (screen) => set({ screen }),
      openSetup: (solo) => set({ screen: 'setup', setupSolo: solo }),
      start: (config, participants) => set({ game: createGame(config, participants), screen: 'game' }),
      dispatch: (action) =>
        set((s) => {
          if (!s.game) return s;
          const game = gameReducer(s.game, action);
          return game === s.game ? s : { game, screen: game.phase === 'termine' ? 'result' : s.screen };
        }),
      quit: () => set({ game: null, screen: 'home' }),
    }),
    {
      name: 'mercato-duel:game',
      // v2 : nouvelles règles (mystère payant…) — une partie v1 en cours n'est pas reprise.
      version: 2,
      migrate: () => ({ game: null, screen: 'home' }) as unknown as GameStore,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ game: s.game, screen: s.screen === 'game' ? 'game' : 'home' }),
      // Une sauvegarde qui référence des joueurs absents de la base (ancienne version) est ignorée.
      merge: (persisted, current) => {
        const p = persisted as Partial<GameStore> | undefined;
        const known = new Set(PLAYERS.map((x) => x.id));
        const valid = !p?.game || p.game.pool.every((id) => known.has(id));
        return valid ? { ...current, ...p } : current;
      },
    },
  ),
);
