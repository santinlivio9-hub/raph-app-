import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuctionType, DraftOffer } from '../game/types';
import { safeStorage } from '../lib/storage';

export interface Settings {
  ordreAleatoire: boolean;
  auctionType: AuctionType;
  startBudget: number;
  timerSeconds: number;
  draftOffer: DraftOffer;
  draftReroll: boolean;
  sons: boolean;
  vibrations: boolean;
  tutorialSeen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  ordreAleatoire: false,
  auctionType: 'aveugle',
  startBudget: 1500,
  timerSeconds: 10,
  draftOffer: 'poste',
  draftReroll: true,
  sons: true,
  vibrations: true,
  tutorialSeen: false,
};

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      reset: () => set({ ...DEFAULT_SETTINGS, tutorialSeen: true }),
    }),
    { name: 'mercato-duel:settings', storage: createJSONStorage(() => safeStorage) },
  ),
);
