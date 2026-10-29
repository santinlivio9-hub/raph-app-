import type { StateStorage } from 'zustand/middleware';

/** localStorage protégé : navigation privée, quota plein ou stockage bloqué ne cassent pas l'app. */
export const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* stockage indisponible : on continue sans sauvegarde */
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
    } catch {
      /* idem */
    }
  },
};
