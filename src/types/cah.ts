import type { CAHGame, CAHPlayer, CAHRound, CAHCard, CAHSubmission, CAHGameCard, CAHDeck } from "@prisma/client";

export interface CAHGameWithDetails extends CAHGame {
  players: CAHPlayerWithUser[];
  rounds: CAHRoundWithDetails[];
  decks: CAHGameDeckWithDeck[];
  CAHgameCards: CAHGameCardWithCard[];
}

export interface CAHPlayerWithUser extends CAHPlayer {
  user: {
    id: string;
    name: string;
  };
  hand: CAHPlayerHandWithCard[];
  CAHsubmissions: CAHSubmissionWithItems[];
}

export interface CAHPlayerHandWithCard {
  id: string;
  position: number;
  addedAt: Date;
  CAHgameCard: CAHGameCardWithCard;
}

export interface CAHGameCardWithCard extends CAHGameCard {
  card: CAHCard;
}

export interface CAHRoundWithDetails extends CAHRound {
  blackCard: CAHCard;
  czar: CAHPlayerWithUser;
  CAHsubmissions: CAHSubmissionWithItems[];
  submittedCards: CAHGameCardWithCard[];
  winningWhiteCards: CAHCard[];
}

export interface CAHSubmissionWithItems extends CAHSubmission {
  items: CAHSubmissionItemWithCard[];
  player: CAHPlayerWithUser;
}

export interface CAHSubmissionItemWithCard {
  id: number;
  position: number;
  CAHgameCard: CAHGameCardWithCard;
}

export interface CAHGameDeckWithDeck {
  gameId: string;
  deckId: string;
  includeWhite: boolean;
  includeBlack: boolean;
  position: number;
  deck: CAHDeck;
}

export interface CAHGameState {
  game: CAHGameWithDetails;
  currentPlayer: CAHPlayerWithUser | null;
  currentRound: CAHRoundWithDetails | null;
  isCzar: boolean;
  canSubmit: boolean;
  hasSubmitted: boolean;
  selectedCards: string[];
  gamePhase: 'setup' | 'lobby' | 'playing' | 'judging' | 'round_end' | 'game_end';
}

export interface CAHDeckInfo {
  id: string;
  name: string;
  whiteCount: number;
  blackCount: number;
  totalCards: number;
}

export interface CAHSetupConfig {
  selectedDecks: string[];
  winningScore: number;
  allowPlayerJoinsAfterStart: boolean;
  shuffleSeed?: string;
  gameName?: string;
}

export interface CAHCardSelection {
  cardId: string;
  position: number;
}

export interface CAHVoteData {
  submissionId: string;
  playerId: string;
}

// Socket events
export interface CAHSocketEvents {
  'game:state-changed': (gameState: CAHGameState) => void;
  'game:player-joined': (player: CAHPlayerWithUser) => void;
  'game:player-left': (playerId: string) => void;
  'game:round-started': (round: CAHRoundWithDetails) => void;
  'game:submission-received': (submission: CAHSubmissionWithItems) => void;
  'game:all-submissions-received': (submissions: CAHSubmissionWithItems[]) => void;
  'game:vote-cast': (vote: CAHVoteData) => void;
  'game:round-ended': (round: CAHRoundWithDetails) => void;
  'game:game-ended': (game: CAHGameWithDetails) => void;
  'game:error': (error: string) => void;
}

// Game phases
export type CAHGamePhase = 'setup' | 'lobby' | 'playing' | 'judging' | 'round_end' | 'game_end';

// Round status
export type CAHRoundStatus = 'WAITING_FOR_CAHSUBMISSIONS' | 'WAITING_FOR_JUDGMENT' | 'COMPLETED';

// Game status
export type CAHGameStatus = 'LOBBY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
