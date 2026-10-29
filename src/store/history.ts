import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GameMode } from '../game/types';
import { safeStorage } from '../lib/storage';

export interface HistoryEntry {
  id: string;
  date: number;
  mode: GameMode;
  names: [string, string];
  colors: [string, string];
  scores: [number, number];
  winner: 0 | 1 | null;
  vsBot: boolean;
}

interface HistoryStore {
  entries: HistoryEntry[];
  record: (e: HistoryEntry) => void;
  clear: () => void;
}

export const MAX_HISTORY = 100;

export const useHistory = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      record: (e) =>
        set((s) => (s.entries.some((x) => x.id === e.id) ? s : { entries: [e, ...s.entries].slice(0, MAX_HISTORY) })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'mercato-duel:history', storage: createJSONStorage(() => safeStorage) },
  ),
);

export function palmares(entries: HistoryEntry[]) {
  return entries.reduce(
    (acc, e) => {
      if (e.winner === null) acc.nuls++;
      else if (e.winner === 0) acc.j1++;
      else if (e.vsBot) acc.bot++;
      else acc.j2++;
      return acc;
    },
    { j1: 0, j2: 0, bot: 0, nuls: 0 },
  );
}
