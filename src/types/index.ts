// User types
export interface User {
  id: string;
  email: string;
  name: string;
  currentRoom: string | null;
}

// Card types
export type Authenticity = 'authentic' | 'corrupted' | 'fatalGlitch';

export interface MemoryCard {
  memory: string; // The memory text/description
  authenticity: Authenticity; // Whether it's authentic, corrupted, or fatal glitch
  value: number; // Points (+1, -1, -10 based on authenticity)
}

export interface ItemCard {
  id: string;
  name: string;
  description: string;
  effect: string;
}

// Deck types
export interface Deck {
  memoryCards: MemoryCard[];
  itemCards: ItemCard[];
}

// Player types
export interface Player {
  userId: string;
  integrity: number;
  items: ItemCard[];
}

// Player info for UI display
export interface PlayerInfo {
  id: string;
  name: string;
  integrity: number;
}

// Room types
export type RoomStatus = 'waiting' | 'intro' | 'playing' | 'finished';

// Turn state types
export type TurnState = 'draw' | 'decide' | 'opponent_decide' | 'reveal';

export interface Room {
  id: string;
  players: Player[];
  status: RoomStatus;
  createdAt: Date;
  finishedAt: Date | null;
  lastUpdate: Date;
  orderPlayers: string[];
  turn: number;
  memoryDeck: MemoryCard[];
  currentCard: MemoryCard | null;
  tableCards: MemoryCard[]; // 3 cards visible on the table
  cardsDrawn: number; // Number of cards drawn from memory_deck
  turnState: TurnState; // Current turn state (draw, decide, opponent_decide, reveal)
  selectedCardIndex: number | null; // Index of the card selected from table_cards
  currentMultiplier: number; // Points multiplier (1 or 3)
  cardInitiator: string | null; // UserId of the player who originally selected the card
}

// Firestore-specific types (with snake_case to match database schema)
export interface FirestorePlayer {
  integrity: number;
  items: ItemCard[];
}

export interface FirestoreRoom {
  players: {
    [userId: string]: FirestorePlayer;
  };
  status: RoomStatus;
  createdAt: any; // Firebase Timestamp
  finishedAt: any | null; // Firebase Timestamp
  lastUpdate: any; // Firebase Timestamp
  order_players: string[];
  turn: number;
  memory_deck: MemoryCard[];
  current_card: MemoryCard | null;
  table_cards: MemoryCard[]; // 3 cards visible on the table
  cards_drawn: number; // Number of cards drawn from memory_deck
  turn_state: TurnState; // Current turn state (draw, decide, opponent_decide, reveal)
  selected_card_index: number | null; // Index of the card selected from table_cards
  current_multiplier: number; // Points multiplier (1 or 3)
  card_initiator: string | null; // UserId of the player who originally selected the card
  revealed_real_memories: string[]; // Array of authentic memory texts that have been claimed
  winner?: string | null; // UserId of the winner when game is finished
  win_reason?: string; // Reason for victory ('reached_10_points' | 'opponent_defeated')
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}
