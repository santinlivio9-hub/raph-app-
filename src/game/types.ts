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

export interface Player {
  id: string;
  nom: string;
  prenom: string;
  poste: Poste;
  postesSecondaires: Poste[];
  club: string;
  ligue: string;
  nationalite: string;
  age: number;
  note: number;
  stats: StatsChamp | StatsGardien;
  valeurMarche: number;
  rarete: Rarete;
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

export type PickVia = 'enchere' | 'mystere' | 'joker' | 'draft' | 'cadeau';

export interface Pick {
  playerId: string;
  slot: SlotId;
  /** Prix payé en M€ (0 pour un joueur mystère / draft). */
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
  jokerUsed: boolean;
  /** Joueur mystère avant l'usage du joker, s'il y en a eu un. */
  firstMysteryId?: string;
}

export interface AuctionState {
  cardId: string;
  /** Tiré AVANT la révélation de la carte : personne ne le connaît. */
  mysteryId: string;
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
  log: LogEntry[];
}
