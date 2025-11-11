import type { MemoryCard, FirestoreRoom, Authenticity } from '@/types';

/**
 * Creates a mock MemoryCard for testing
 */
export const createMockMemoryCard = (
  authenticity: Authenticity = 'authentic',
  memory: string = 'Test memory'
): MemoryCard => {
  const valueMap = {
    authentic: 1,
    corrupted: -1,
    fatalGlitch: -10
  };

  return {
    memory,
    authenticity,
    value: valueMap[authenticity]
  };
};

/**
 * Creates a mock memory deck with specified authenticity distribution
 */
export const createMockDeck = (
  authentic: number = 5,
  corrupted: number = 5,
  fatalGlitch: number = 5
): MemoryCard[] => {
  const deck: MemoryCard[] = [];

  for (let i = 0; i < authentic; i++) {
    deck.push(createMockMemoryCard('authentic', `Authentic memory ${i + 1}`));
  }

  for (let i = 0; i < corrupted; i++) {
    deck.push(createMockMemoryCard('corrupted', `Corrupted memory ${i + 1}`));
  }

  for (let i = 0; i < fatalGlitch; i++) {
    deck.push(createMockMemoryCard('fatalGlitch', `Fatal glitch ${i + 1}`));
  }

  return deck;
};

/**
 * Creates a mock FirestoreRoom for testing
 */
export const createMockRoom = (
  player1Id: string = 'player1',
  player2Id: string = 'player2',
  overrides?: Partial<FirestoreRoom>
): FirestoreRoom => {
  const memoryDeck = createMockDeck(5, 5, 5);

  return {
    players: {
      [player1Id]: {
        integrity: 0,
        items: []
      },
      [player2Id]: {
        integrity: 0,
        items: []
      }
    },
    status: 'playing',
    createdAt: new Date(),
    finishedAt: null,
    lastUpdate: new Date(),
    order_players: [player1Id, player2Id],
    turn: 0,
    memory_deck: memoryDeck,
    current_card: null,
    table_cards: memoryDeck.slice(0, 3),
    cards_drawn: 3,
    turn_state: 'draw',
    selected_card_index: null,
    current_multiplier: 1,
    card_initiator: null,
    used_cards: [],
    ...overrides
  };
};

/**
 * Waits for a specified time (useful for async operations)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone an object (useful for test data)
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
