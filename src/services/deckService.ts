import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GAME_CONFIG, type Authenticity } from '@/config/gameConfig';
import { roomLogger } from '@/lib/utils/logger';
import type { MemoryCard } from '@/types';

// Cache for deck data to avoid repeated Firestore calls
let cachedMemories: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns Shuffled copy of the array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Fetches memories from Firestore with caching
 * @returns Promise with array of memory strings
 * @throws Error if deck doesn't exist or is invalid
 */
async function fetchMemoriesFromFirestore(): Promise<string[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedMemories && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    roomLogger.debug('Using cached memories', {
      cacheAge: Math.floor((now - cacheTimestamp) / 1000),
      totalMemories: cachedMemories.length
    });
    return cachedMemories;
  }

  roomLogger.info('Fetching memories from Firestore');

  // Fetch fresh data from Firestore
  const deckRef = doc(db, 'decks', 'default');
  const deckSnap = await getDoc(deckRef);

  if (!deckSnap.exists()) {
    throw new Error('Default deck not found. Run seed:deck script first.');
  }

  const deckData = deckSnap.data();
  const memories = deckData.memories as string[];

  if (!memories || !Array.isArray(memories)) {
    throw new Error('Deck does not have a valid "memories" field.');
  }

  if (memories.length === 0) {
    throw new Error('Deck is empty. At least one memory is required.');
  }

  // Update cache
  cachedMemories = memories;
  cacheTimestamp = now;

  roomLogger.info('Memories fetched and cached', {
    totalMemories: memories.length,
    cacheExpiry: CACHE_DURATION_MS / 1000 / 60
  });

  return memories;
}

/**
 * Generates a random deck of memory cards for a game room
 * Fetches memories from /decks/default and assigns random authenticity
 *
 * @returns Promise with array of 15 memory cards with assigned authenticity
 * @throws Error if deck doesn't exist or has insufficient cards
 */
export const generateGameDeck = async (): Promise<MemoryCard[]> => {
  roomLogger.info('Generating game deck from default deck');

  try {
    // Fetch memories with caching
    const allMemories = await fetchMemoriesFromFirestore();

    // Validate sufficient memories
    if (allMemories.length < GAME_CONFIG.deck.totalCards) {
      throw new Error(`Deck needs at least ${GAME_CONFIG.deck.totalCards} memories. Currently has ${allMemories.length}.`);
    }

    // Warning if memory pool is too small (risk of repetitive games)
    const recommendedMinimum = GAME_CONFIG.deck.totalCards * 3;
    if (allMemories.length < recommendedMinimum) {
      roomLogger.warn('Memory pool is small, games may feel repetitive', {
        currentSize: allMemories.length,
        recommended: recommendedMinimum
      });
    }

    roomLogger.debug('Deck validated successfully', {
      totalMemories: allMemories.length,
      requiredCards: GAME_CONFIG.deck.totalCards
    });

    // Step 1: Randomly select 15 memories from the pool
    const shuffledMemories = shuffleArray(allMemories);
    const selectedMemories = shuffledMemories.slice(0, GAME_CONFIG.deck.totalCards);

    // Step 2: Create authenticity distribution array (without fatal glitches)
    const nonFatalAuthenticities: Authenticity[] = [
      ...Array(GAME_CONFIG.deck.distribution.authentic).fill('authentic'),
      ...Array(GAME_CONFIG.deck.distribution.corrupted).fill('corrupted'),
    ];

    // Verify distribution adds up to totalCards
    const totalAuthenticities = nonFatalAuthenticities.length + GAME_CONFIG.deck.distribution.fatalGlitch;
    if (totalAuthenticities !== GAME_CONFIG.deck.totalCards) {
      throw new Error(`Authenticity distribution (${totalAuthenticities}) does not match total cards (${GAME_CONFIG.deck.totalCards})`);
    }

    // Step 3: Shuffle non-fatal authenticity assignments
    const shuffledNonFatal = shuffleArray(nonFatalAuthenticities);

    // Step 4: Insert fatal glitches at random positions (but never in first 7 positions)
    const minFatalPosition = 7; // Fatal glitch can only appear from position 7 onwards (index 7 = 8th card)
    const shuffledAuthenticity: Authenticity[] = [...shuffledNonFatal];

    for (let i = 0; i < GAME_CONFIG.deck.distribution.fatalGlitch; i++) {
      // Random position from minFatalPosition to end of deck
      const randomPosition = minFatalPosition + Math.floor(Math.random() * (GAME_CONFIG.deck.totalCards - minFatalPosition));
      shuffledAuthenticity.splice(randomPosition, 0, 'fatalGlitch');
    }

    roomLogger.debug('Fatal glitch positions', {
      positions: shuffledAuthenticity
        .map((auth, idx) => auth === 'fatalGlitch' ? idx : -1)
        .filter(idx => idx !== -1)
    });

    // Step 5: Create memory cards by combining memories with authenticity
    const memoryDeck: MemoryCard[] = selectedMemories.map((memory, index) => {
      const authenticity = shuffledAuthenticity[index];
      const value = GAME_CONFIG.pointValues[authenticity];

      return {
        memory,
        authenticity,
        value,
      };
    });

    roomLogger.info('Game deck generated successfully', {
      totalCards: memoryDeck.length,
      distribution: {
        authentic: memoryDeck.filter(c => c.authenticity === 'authentic').length,
        corrupted: memoryDeck.filter(c => c.authenticity === 'corrupted').length,
        fatalGlitch: memoryDeck.filter(c => c.authenticity === 'fatalGlitch').length,
      }
    });

    return memoryDeck;
  } catch (error: any) {
    if (error instanceof Error) {
      roomLogger.error('Failed to generate game deck', { message: error.message });
      throw error;
    }

    roomLogger.error('Unexpected error generating game deck', { error });
    throw new Error('Failed to generate memory deck.');
  }
};
