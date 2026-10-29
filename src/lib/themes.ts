/**
 * Thèmes visuels originaux par compétition (dégradé + motif + accent), inspirés de leur ambiance
 * sans reprendre logos ni marques. Tout est en CSS/SVG : aucun fichier image.
 */
export interface Theme {
  id: string;
  label: string;
  /** Couleur d'accent (bordures de carte, détails). */
  accent: string;
  /** Texte lisible posé sur l'accent. */
  onAccent: string;
  /** Fond complet (motif + dégradé), à poser sous un voile sombre. */
  background: string;
}

const svg = (body: string, size = 40) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>${body}</svg>`)}")`;

export const THEMES: Record<string, Theme> = {
  'Ligue 1': {
    id: 'ligue1',
    label: 'Ligue 1',
    accent: '#C6F432',
    onAccent: '#0A1640',
    background: `${svg("<path d='M0 40L40 0' stroke='%23C6F432' stroke-opacity='0.07' stroke-width='6'/>")}, radial-gradient(120% 70% at 80% 0%, #1b3a8a 0%, transparent 60%), linear-gradient(160deg, #0a1640 0%, #050b24 100%)`,
  },
  'Premier League': {
    id: 'premier',
    label: 'Premier League',
    accent: '#FF2D8A',
    onAccent: '#1B0330',
    background: `${svg("<circle cx='10' cy='10' r='1.6' fill='%23FF2D8A' fill-opacity='0.16'/>", 20)}, radial-gradient(110% 70% at 10% 0%, #5b1290 0%, transparent 60%), linear-gradient(170deg, #2a0a4a 0%, #12021f 100%)`,
  },
  Liga: {
    id: 'liga',
    label: 'Liga',
    accent: '#FF8A2A',
    onAccent: '#2A0C06',
    background: `repeating-conic-gradient(from 0deg at 50% -10%, rgba(255,138,42,0.07) 0deg 6deg, transparent 6deg 18deg), radial-gradient(100% 60% at 50% 0%, #8f2c18 0%, transparent 65%), linear-gradient(175deg, #5a1a12 0%, #200805 100%)`,
  },
  'Serie A': {
    id: 'seriea',
    label: 'Serie A',
    accent: '#2DE0D0',
    onAccent: '#031326',
    background: `${svg("<path d='M20 2L38 12V32L20 42L2 32V12Z' fill='none' stroke='%232DE0D0' stroke-opacity='0.08' stroke-width='1.5'/>", 40)}, radial-gradient(110% 70% at 90% 0%, #0f3d70 0%, transparent 60%), linear-gradient(165deg, #071b3a 0%, #020a18 100%)`,
  },
  Bundesliga: {
    id: 'bundesliga',
    label: 'Bundesliga',
    accent: '#F2EDE4',
    onAccent: '#3D070C',
    background: `repeating-linear-gradient(180deg, rgba(242,237,228,0.05) 0 2px, transparent 2px 26px), radial-gradient(110% 70% at 20% 0%, #9a1420 0%, transparent 60%), linear-gradient(170deg, #5c0b12 0%, #1d0306 100%)`,
  },
  autres: {
    id: 'autres',
    label: 'Autres championnats',
    accent: '#F5C542',
    onAccent: '#1A1405',
    background: `${svg("<path d='M0 20H40M20 0V40' stroke='%23F5C542' stroke-opacity='0.05' stroke-width='1'/>", 40)}, radial-gradient(110% 70% at 50% 0%, #3a3d45 0%, transparent 60%), linear-gradient(170deg, #22252b 0%, #0d0f12 100%)`,
  },
};

/** Thème neutre « stade de nuit » quand aucune compétition n'est en jeu. */
export const NIGHT_THEME: Theme = {
  id: 'nuit',
  label: 'Stade de nuit',
  accent: '#F5C542',
  onAccent: '#0B0F14',
  background:
    'radial-gradient(120% 60% at 50% -10%, rgba(61,255,140,0.08), transparent 60%), radial-gradient(80% 40% at 50% 0%, rgba(245,197,66,0.06), transparent 70%), #0B0F14',
};

export function themeFor(competition: string | null | undefined): Theme {
  if (!competition) return NIGHT_THEME;
  return THEMES[competition] ?? THEMES.autres;
}
