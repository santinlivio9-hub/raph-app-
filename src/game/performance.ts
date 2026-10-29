import { SLOT_POSTE } from './formation';
import type { Player, Poste, SlotId } from './types';

/** En dessous de ce temps de jeu, le score de performance est réduit. */
export const LOW_MINUTES = 900;
export const PERF_PENALTY_SECONDARY = 4;
export const PERF_PENALTY_OUT_OF_POSITION = 15;

type Component = 'buts' | 'passes' | 'defense' | 'cleanSheets' | 'arrets' | 'note';

/**
 * Pondérations par poste, et « référence élite » pour chaque composante :
 * atteindre la référence vaut 100 % de la composante (au-delà, c'est plafonné).
 * buts/passes/défense/arrêts : par 90 min ; clean sheets : par match ; note : de 6,0 (0 %) à 8,0 (100 %).
 */
const WEIGHTS: Record<Poste, Partial<Record<Component, number>>> = {
  BU: { buts: 0.45, passes: 0.2, note: 0.35 },
  AG: { buts: 0.3, passes: 0.3, note: 0.4 },
  AD: { buts: 0.3, passes: 0.3, note: 0.4 },
  MC: { passes: 0.2, buts: 0.15, defense: 0.25, note: 0.4 },
  DC: { defense: 0.35, cleanSheets: 0.25, note: 0.4 },
  DG: { defense: 0.25, cleanSheets: 0.2, passes: 0.15, note: 0.4 },
  DD: { defense: 0.25, cleanSheets: 0.2, passes: 0.15, note: 0.4 },
  GK: { arrets: 0.25, cleanSheets: 0.35, note: 0.4 },
};

const REFERENCE: Record<Poste, Record<Component, number>> = {
  BU: { buts: 0.8, passes: 0.35, defense: 1, cleanSheets: 1, arrets: 1, note: 1 },
  AG: { buts: 0.55, passes: 0.4, defense: 1, cleanSheets: 1, arrets: 1, note: 1 },
  AD: { buts: 0.55, passes: 0.4, defense: 1, cleanSheets: 1, arrets: 1, note: 1 },
  MC: { buts: 0.3, passes: 0.3, defense: 3.6, cleanSheets: 1, arrets: 1, note: 1 },
  DC: { buts: 1, passes: 1, defense: 3.4, cleanSheets: 0.42, arrets: 1, note: 1 },
  DG: { buts: 1, passes: 0.25, defense: 3.4, cleanSheets: 0.42, arrets: 1, note: 1 },
  DD: { buts: 1, passes: 0.25, defense: 3.4, cleanSheets: 0.42, arrets: 1, note: 1 },
  GK: { buts: 1, passes: 1, defense: 1, cleanSheets: 0.42, arrets: 2.8, note: 1 },
};

export interface PerfBreakdown {
  /** Score final 0–100 (pénalités incluses). */
  score: number;
  /** Score brut du joueur à son poste naturel, avant pénalités. */
  base: number;
  minutesFactor: number;
  positionPenalty: number;
  components: { key: Component; value: number; weight: number }[];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Score de performance (0–100) d'un joueur à une case donnée, normalisé par 90 minutes. */
export function perfBreakdown(player: Player, slot?: SlotId): PerfBreakdown {
  const f = player.perf;
  const poste = player.poste;
  const nineties = f.minutes / 90;
  const per90 = (x: number) => (nineties > 0 ? x / nineties : 0);
  const raw: Record<Component, number> = {
    buts: per90(f.buts),
    passes: per90(f.passesD),
    defense: per90(f.tacles + f.interceptions),
    cleanSheets: f.matchs ? f.cleanSheets / f.matchs : 0,
    arrets: per90(f.arrets),
    note: (f.noteMoyenne - 6) / 2,
  };
  const components = (Object.entries(WEIGHTS[poste]) as [Component, number][]).map(([key, weight]) => ({
    key,
    weight,
    value: clamp01(key === 'note' ? raw.note : raw[key] / REFERENCE[poste][key]),
  }));
  const base = 100 * components.reduce((s, c) => s + c.value * c.weight, 0);
  const minutesFactor = f.minutes >= LOW_MINUTES ? 1 : 0.5 + 0.5 * (f.minutes / LOW_MINUTES);
  const target = slot ? SLOT_POSTE[slot] : poste;
  const positionPenalty =
    target === poste ? 0 : player.postesSecondaires.includes(target) ? PERF_PENALTY_SECONDARY : PERF_PENALTY_OUT_OF_POSITION;
  const score = Math.max(0, Math.min(100, base * minutesFactor - positionPenalty));
  return { score: Math.round(score * 10) / 10, base: Math.round(base * 10) / 10, minutesFactor, positionPenalty, components };
}

export function perfScore(player: Player, slot?: SlotId): number {
  return perfBreakdown(player, slot).score;
}

export const COMPONENT_LABEL: Record<Component, string> = {
  buts: 'Buts',
  passes: 'Passes D.',
  defense: 'Tacles + interc.',
  cleanSheets: 'Clean sheets',
  arrets: 'Arrêts',
  note: 'Note moyenne',
};
