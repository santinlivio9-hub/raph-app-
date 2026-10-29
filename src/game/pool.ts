import { PLAYERS } from './db';
import { SLOTS, SLOT_POSTE } from './formation';
import type { GameConfig, Player, Poste } from './types';

/** Compétitions avec un thème dédié ; les autres partagent le thème « Autres championnats ». */
export const MAIN_COMPETITIONS = ['Ligue 1', 'Premier League', 'Liga', 'Serie A', 'Bundesliga'] as const;

export const NOTORIETE_STANDARD = 3;
export const NOTORIETE_EXPERT = 2;

/** Joueurs minimum par poste dans la pioche : de quoi jouer chaque case avec 2 mystères et plusieurs cartes. */
export function minimumFor(poste: Poste): number {
  return 4 * SLOTS.filter((s) => SLOT_POSTE[s] === poste).length + 2;
}

/**
 * Pioche de la partie : notoriété ≥ 3 (≥ 2 en mode Expert), éventuellement limitée à une compétition.
 * Si un poste manque de joueurs dans la compétition choisie, il est complété par les joueurs
 * les plus connus des autres championnats.
 */
export function buildPool(config: Pick<GameConfig, 'pool' | 'expert'>): string[] {
  const minNoto = config.expert ? NOTORIETE_EXPERT : NOTORIETE_STANDARD;
  const known = PLAYERS.filter((p) => p.notoriete >= minNoto);
  if (config.pool === 'toutes') return known.map((p) => p.id);
  const chosen = known.filter((p) => p.competition === config.pool);
  const ids = chosen.map((p) => p.id);
  const postes = [...new Set(Object.values(SLOT_POSTE))];
  for (const poste of postes) {
    const have = chosen.filter((p) => p.poste === poste).length;
    const need = minimumFor(poste) - have;
    if (need <= 0) continue;
    const extra = known
      .filter((p) => p.poste === poste && p.competition !== config.pool)
      .sort((a: Player, b: Player) => b.notoriete - a.notoriete || b.valeurMarche - a.valeurMarche)
      .slice(0, need);
    ids.push(...extra.map((p) => p.id));
  }
  return ids;
}

export function competitionsAvailable(): string[] {
  return [...MAIN_COMPETITIONS];
}
