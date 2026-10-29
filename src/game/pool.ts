import { PLAYERS } from './db';
import { SLOTS, SLOT_POSTE } from './formation';
import type { GameConfig, Player, Poste } from './types';

/** Compétitions avec un thème dédié ; les autres partagent le thème « Autres championnats ». */
export const MAIN_COMPETITIONS = ['Ligue 1', 'Premier League', 'Liga', 'Serie A', 'Bundesliga'] as const;

/** Seuls les joueurs que tout fan de foot reconnaît (notoriété ≥ 4 sur 5) sont dans la base. */
export const NOTORIETE_MIN = 4;

/** Joueurs minimum par poste dans la pioche : de quoi jouer chaque case avec 2 mystères et plusieurs cartes. */
export function minimumFor(poste: Poste): number {
  return 4 * SLOTS.filter((s) => SLOT_POSTE[s] === poste).length + 2;
}

/**
 * Pioche de la partie : joueurs connus (notoriété ≥ 4), éventuellement limités à une compétition.
 * Si un poste manque de joueurs dans la compétition choisie, il est complété par les joueurs
 * les plus connus des autres championnats.
 */
export function buildPool(config: Pick<GameConfig, 'pool'>): string[] {
  const known = PLAYERS.filter((p) => p.notoriete >= NOTORIETE_MIN);
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
