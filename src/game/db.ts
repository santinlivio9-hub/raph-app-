import raw from '../data/players.json';
import type { Player, Poste } from './types';

export const PLAYERS = raw as Player[];

/** Saison de référence des performances, ex. « saison 2024-25 ». */
export const PERF_SEASON_LABEL = `saison ${PLAYERS[0]?.perf.saison ?? ''}`;

const BY_ID = new Map(PLAYERS.map((p) => [p.id, p]));

export function getPlayer(id: string): Player {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Joueur inconnu : ${id}`);
  return p;
}

export function playersOfPoste(ids: readonly string[], poste: Poste): Player[] {
  return ids.map(getPlayer).filter((p) => p.poste === poste);
}

export function displayName(p: Player): string {
  return p.prenom ? `${p.prenom} ${p.nom}` : p.nom;
}

export function initials(p: Player): string {
  const parts = displayName(p).split(/[\s-]+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return letters.toUpperCase();
}
