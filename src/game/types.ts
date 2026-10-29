export type Poste = 'GK' | 'DC' | 'DG' | 'DD' | 'MC' | 'AG' | 'AD' | 'BU';
export type Rarete = 'bronze' | 'argent' | 'or' | 'elite';

/** Stats de joueur de champ. */
export interface StatsChamp {
  vit: number;
  tir: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

/** Stats de gardien : plongeon, jeu à la main, dégagement, réflexes, vitesse, placement. */
export interface StatsGardien {
  plo: number;
  mai: number;
  deg: number;
  ref: number;
  vit: number;
  pla: number;
}

/** Performances réelles sur la saison de référence (championnat). */
export interface Perf {
  saison: string;
  matchs: number;
  minutes: number;
  buts: number;
  passesD: number;
  cleanSheets: number;
  arrets: number;
  tacles: number;
  interceptions: number;
  /** Note moyenne sur 10. */
  noteMoyenne: number;
}

export interface Player {
  id: string;
  nom: string;
  prenom: string;
  poste: Poste;
  postesSecondaires: Poste[];
  club: string;
  competition: string;
  nationalite: string;
  age: number;
  valeurMarche: number;
  /** Note générale (40–99), affichée seulement en Draft. */
  noteGenerale: number;
  /** 1 à 5 : à quel point un fan lambda reconnaît le joueur. */
  notoriete: number;
  wikidataId: string | null;
  stats: StatsChamp | StatsGardien;
  rarete: Rarete;
  perf: Perf;
}

/** Les 11 cases du 4-3-3. */
export type SlotId = 'GK' | 'DCG' | 'DCD' | 'DG' | 'DD' | 'MCG' | 'MC' | 'MCD' | 'AG' | 'BU' | 'AD';

export type ParticipantIndex = 0 | 1;
export type BotLevel = 'facile' | 'moyen' | 'difficile';

export interface Participant {
  name: string;
  color: string;
  isBot: boolean;
  botLevel?: BotLevel;
}

/** cadeau = cas limite (doubles passes répétées) ; brade = mystère trop cher, cédé au prix payable. */
export type PickVia = 'enchere' | 'mystere' | 'joker' | 'draft' | 'cadeau' | 'brade';

export interface Pick {
  playerId: string;
  slot: SlotId;
  /** Prix payé en M€ (enchère gagnée ou valeur marché du mystère ; 0 en draft). */
  price: number;
  via: PickVia;
  /** Ordre d'arrivée dans l'équipe (1 = premier). */
  order: number;
}

export interface TeamState {
  lineup: Partial<Record<SlotId, Pick>>;
  budget: number;
  jokers: number;
  rerolls: number;
}

export type GameMode = 'enchere' | 'draft';
export type AuctionType = 'aveugle' | 'direct';
export type DraftOffer = 'poste' | 'libre';

export interface GameConfig {
  mode: GameMode;
  startBudget: number;
  slotOrder: SlotId[];
  auctionType: AuctionType;
  draftOffer: DraftOffer;
  draftReroll: boolean;
  timerSeconds: number;
  /** Compétition unique (thème de toute la partie) ou toutes les compétitions. */
  pool: string | 'toutes';
  /** Part des performances dans le score Enchères (le reste = collectif). */
  perfWeight: number;
  /** Vote « Verdict des potes » avant la révélation des performances. */
  verdictDesPotes: boolean;
  seed: number;
}

export interface AuctionResult {
  slot: SlotId;
  cardId: string;
  winner: ParticipantIndex;
  price: number;
  bids: [number, number];
  tieBreak: 'aucun' | 'budget' | 'tirage';
  mysteryId: string;
  /** Prix payé par le perdant pour son mystère (sa valeur marché, ou moins s'il est bradé). */
  mysteryPrice: number;
  jokerUsed: boolean;
  /** Joueur mystère avant l'usage du joker (remboursé), s'il y en a eu un. */
  firstMysteryId?: string;
  firstMysteryPrice?: number;
}

export interface AuctionState {
  cardId: string;
  /**
   * Mystère de chaque participant, tiré AVANT la révélation de la carte (personne ne les connaît).
   * Chacun est choisi pour être payable par ce participant s'il perd ; seul celui du perdant sert.
   */
  mysteries: [string, string];
  bids: [number | null, number | null];
  live: { high: number; bidder: ParticipantIndex | null };
  doublePasses: number;
  result: AuctionResult | null;
}

export interface DraftState {
  pickIndex: number;
  offer: string[];
}

export type GamePhase = 'encheres' | 'mystere' | 'draft' | 'termine';

export interface LogEntry {
  kind: 'adjuge' | 'double-passe' | 'mystere' | 'joker' | 'draft' | 'cadeau' | 'relance';
  text: string;
}

export interface GameState {
  id: string;
  createdAt: number;
  config: GameConfig;
  participants: [Participant, Participant];
  teams: [TeamState, TeamState];
  /** Ids des joueurs encore disponibles. */
  pool: string[];
  rng: number;
  slotIndex: number;
  phase: GamePhase;
  auction: AuctionState | null;
  draft: DraftState | null;
  /** Verdict des potes : pour quelle équipe chaque participant a voté (null = pas encore). */
  votes: [ParticipantIndex | null, ParticipantIndex | null];
  log: LogEntry[];
}
