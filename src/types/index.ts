// User types
export interface User {
  id: string;
  email: string;
  name: string;
  currentRoom: string | null;
}

// Card types
export type CardComposition = 'authentic' | 'corrupted' | 'fatal_glitch';

export interface MemoryCard {
  id: string;
  memory: string;
  value: number;
  composition: CardComposition;
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

// Room types
export type RoomStatus = 'waiting' | 'intro' | 'playing' | 'finished';

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
}

// Firestore-specific types (with snake_case to match database schema)
export interface FirestorePlayer {
  integrity: number;
  items: ItemCard[];
}

export interface FirestoreMemoryDeckCard {
  composition: CardComposition;
  memory: MemoryCard;
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
  memory_deck: FirestoreMemoryDeckCard[];
  current_card: MemoryCard | null;
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
