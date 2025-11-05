/**
 * Game configuration for Backup Deathmatch
 * Adjust these values to balance gameplay
 */

export const GAME_CONFIG = {
  // Deck configuration
  deck: {
    totalCards: 15, // Total cards drawn from deck for each game
    distribution: {
      authentic: 8, // Real memories (+1 points)
      corrupted: 6, // Damaged data (-1 points)
      fatalGlitch: 1, // Fatal corruption (instant -10)
    },
  },

  // Point values for each authenticity type
  pointValues: {
    authentic: 1, // Positive points for real memories
    corrupted: -1, // Negative points for corrupted data
    fatalGlitch: -10, // Fatal glitch - instant massive damage
  },

  // Win conditions
  winConditions: {
    maxIntegrity: 10, // First player to reach this wins
    minIntegrity: 0, // Player at or below this loses (fragmented)
  },

  // Room settings
  room: {
    maxPlayers: 2,
  },
} as const;

// Type exports for type safety
export type Authenticity = 'authentic' | 'corrupted' | 'fatalGlitch';

export type GameConfig = typeof GAME_CONFIG;
