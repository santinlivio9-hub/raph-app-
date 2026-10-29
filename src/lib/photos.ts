import raw from '../data/photos.json';

export interface PhotoCredit {
  url: string;
  auteur: string;
  licence: string;
  licenceUrl: string | null;
  source: string;
}

const PHOTOS = raw as Record<string, PhotoCredit>;

/** Photo Wikimedia Commons (licence libre) d'un joueur, si disponible. */
export function photoOf(playerId: string): PhotoCredit | null {
  return PHOTOS[playerId] ?? null;
}

export function allPhotoCredits(): [string, PhotoCredit][] {
  return Object.entries(PHOTOS);
}
