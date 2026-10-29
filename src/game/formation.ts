import type { Poste, SlotId } from './types';

export const SLOTS: SlotId[] = ['GK', 'DCG', 'DCD', 'DG', 'DD', 'MCG', 'MC', 'MCD', 'AG', 'AD', 'BU'];

/** Ordre par défaut : GK → défense → milieu → attaque. */
export const DEFAULT_ORDER: SlotId[] = [...SLOTS];

export const SLOT_POSTE: Record<SlotId, Poste> = {
  GK: 'GK',
  DCG: 'DC',
  DCD: 'DC',
  DG: 'DG',
  DD: 'DD',
  MCG: 'MC',
  MC: 'MC',
  MCD: 'MC',
  AG: 'AG',
  AD: 'AD',
  BU: 'BU',
};

export const POSTE_LABEL: Record<Poste, string> = {
  GK: 'Gardien',
  DC: 'Défenseur central',
  DG: 'Latéral gauche',
  DD: 'Latéral droit',
  MC: 'Milieu central',
  AG: 'Ailier gauche',
  AD: 'Ailier droit',
  BU: 'Buteur',
};

/** Position sur le terrain vu de dessus (en %, attaque vers le haut). */
export const SLOT_COORDS: Record<SlotId, { x: number; y: number }> = {
  GK: { x: 50, y: 90 },
  DCG: { x: 37, y: 72 },
  DCD: { x: 63, y: 72 },
  DG: { x: 13, y: 66 },
  DD: { x: 87, y: 66 },
  MCG: { x: 25, y: 45 },
  MC: { x: 50, y: 50 },
  MCD: { x: 75, y: 45 },
  AG: { x: 17, y: 20 },
  BU: { x: 50, y: 13 },
  AD: { x: 83, y: 20 },
};

/** Graphe des liens du collectif entre voisins du 4-3-3. */
export const LINKS: [SlotId, SlotId][] = [
  ['GK', 'DCG'],
  ['GK', 'DCD'],
  ['DCG', 'DCD'],
  ['DCG', 'DG'],
  ['DCD', 'DD'],
  ['DCG', 'MC'],
  ['DCD', 'MC'],
  ['DG', 'MCG'],
  ['DD', 'MCD'],
  ['DG', 'AG'],
  ['DD', 'AD'],
  ['MCG', 'MC'],
  ['MC', 'MCD'],
  ['MCG', 'AG'],
  ['MCD', 'AD'],
  ['MC', 'BU'],
  ['AG', 'BU'],
  ['AD', 'BU'],
];

export function neighbours(slot: SlotId): SlotId[] {
  return LINKS.flatMap(([a, b]) => (a === slot ? [b] : b === slot ? [a] : []));
}
