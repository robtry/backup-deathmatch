import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  selectCard,
  claimCard,
  rejectCard,
  opponentClaimCard,
  checkVictoryCondition
} from '@/services/gameService';
import {
  createTestRoom,
  createTestUser,
  cleanupTestData
} from './firebaseTestUtils';
import { createMockMemoryCard } from './testUtils';
import type { FirestoreRoom } from '@/types';

describe('gameService - End-to-End Full Game Tests', () => {
  const ROOM_CODE = 'E2E-GAME-001';
  const PLAYER_1_ID = 'player-one';
  const PLAYER_2_ID = 'player-two';

  beforeEach(async () => {
    await createTestUser(PLAYER_1_ID, 'player1@test.com', 'Player One');
    await createTestUser(PLAYER_2_ID, 'player2@test.com', 'Player Two');
  });

  afterEach(async () => {
    await cleanupTestData([ROOM_CODE], [PLAYER_1_ID, PLAYER_2_ID]);
  });

  it('should complete full game: Player 1 reaches +10 points and wins', async () => {
    // ARRANGE: Create a game with controlled deck (all authentic +2 cards for faster victory)
    // Using +2 cards so Player 1 can reach 10 in 5 turns (5 * 2 = 10)
    const authenticDeck = Array(15).fill(null).map((_, i) => ({
      memory: `Memory ${i + 1}`,
      authenticity: 'authentic' as const,
      value: 2  // Higher value for faster victory
    }));

    await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
      turn_state: 'draw',
      turn: 0,
      memory_deck: authenticDeck,
      table_cards: authenticDeck.slice(0, 3),
      cards_drawn: 3
    });

    const roomRef = doc(db, 'rooms', ROOM_CODE);

    console.log('\n🎮 Starting E2E Game Test: Player 1 aims for +10 points\n');

    // Track game state
    let turnCount = 0;
    let gameOver = false;

    // Simulate turns until someone wins
    while (!gameOver && turnCount < 20) { // Max 20 turns to prevent infinite loop
      turnCount++;

      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data() as FirestoreRoom;

      const currentPlayerIndex = roomData.turn;
      const currentPlayerId = roomData.order_players[currentPlayerIndex];
      const currentPlayerName = currentPlayerId === PLAYER_1_ID ? 'Player 1' : 'Player 2';

      console.log(`\n--- Turn ${turnCount}: ${currentPlayerName}'s turn ---`);
      console.log(`  Player 1 integrity: ${roomData.players[PLAYER_1_ID].integrity}`);
      console.log(`  Player 2 integrity: ${roomData.players[PLAYER_2_ID].integrity}`);
      console.log(`  Cards remaining: ${roomData.table_cards.length}`);

      // Check if there are still cards on the table
      if (roomData.table_cards.length === 0) {
        console.log('  ⚠️  No more cards on table, game ends');
        break;
      }

      // Each player selects first card (index 0) and claims it
      await selectCard(ROOM_CODE, 0, currentPlayerId);
      console.log(`  → ${currentPlayerName} selected card at index 0`);

      await claimCard(ROOM_CODE, currentPlayerId);
      console.log(`  → ${currentPlayerName} claimed the card (+1 point)`);

      // Check victory condition
      const afterTurnSnap = await getDoc(roomRef);
      const afterTurnData = afterTurnSnap.data() as FirestoreRoom;

      const victoryCheck = checkVictoryCondition(
        afterTurnData.players,
        afterTurnData.order_players
      );

      if (victoryCheck.hasWinner) {
        gameOver = true;
        const winnerName = victoryCheck.winnerId === PLAYER_1_ID ? 'Player 1' : 'Player 2';
        console.log(`\n🎉 GAME OVER! ${winnerName} wins by ${victoryCheck.reason}`);
        console.log(`  Final scores:`);
        console.log(`    Player 1: ${afterTurnData.players[PLAYER_1_ID].integrity}`);
        console.log(`    Player 2: ${afterTurnData.players[PLAYER_2_ID].integrity}`);

        // ASSERT: Verify winner and final state
        expect(victoryCheck.winnerId).toBe(PLAYER_1_ID);
        expect(victoryCheck.reason).toBe('reached_10_points');
        expect(afterTurnData.players[PLAYER_1_ID].integrity).toBeGreaterThanOrEqual(10);
      }
    }

    // ASSERT: Game should have ended
    expect(gameOver).toBe(true);
    expect(turnCount).toBeLessThan(20); // Should finish before max turns

    // Player 1 should have won (they go first with all +1 cards)
    const finalSnap = await getDoc(roomRef);
    const finalData = finalSnap.data() as FirestoreRoom;
    expect(finalData.players[PLAYER_1_ID].integrity).toBeGreaterThanOrEqual(10);
  });

  it('should complete full game: Player 2 loses by reaching -3 points', async () => {
    // ARRANGE: Create a game where Player 2 will get corrupted cards (-2 value for faster loss)
    // Interleave authentic (+2) for P1 and corrupted (-2) for P2
    const mixedDeck = Array(15).fill(null).map((_, i) => ({
      memory: `Memory ${i + 1}`,
      authenticity: (i % 2 === 0 ? 'authentic' : 'corrupted') as const,
      value: i % 2 === 0 ? 2 : -2  // Even indices +2, odd indices -2
    }));

    await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
      turn_state: 'draw',
      turn: 0,
      memory_deck: mixedDeck,
      table_cards: mixedDeck.slice(0, 3),
      cards_drawn: 3
    });

    const roomRef = doc(db, 'rooms', ROOM_CODE);

    console.log('\n🎮 Starting E2E Game Test: Player 2 loses by reaching -3\n');

    let turnCount = 0;
    let gameOver = false;

    while (!gameOver && turnCount < 10) {
      turnCount++;

      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.data() as FirestoreRoom;

      const currentPlayerIndex = roomData.turn;
      const currentPlayerId = roomData.order_players[currentPlayerIndex];
      const currentPlayerName = currentPlayerId === PLAYER_1_ID ? 'Player 1' : 'Player 2';

      console.log(`\n--- Turn ${turnCount}: ${currentPlayerName}'s turn ---`);
      console.log(`  Player 1 integrity: ${roomData.players[PLAYER_1_ID].integrity}`);
      console.log(`  Player 2 integrity: ${roomData.players[PLAYER_2_ID].integrity}`);

      // Check if there are still cards on the table
      if (roomData.table_cards.length === 0) {
        console.log('  ⚠️  No more cards on table, game ends');
        break;
      }

      await selectCard(ROOM_CODE, 0, currentPlayerId);
      await claimCard(ROOM_CODE, currentPlayerId);

      const afterTurnSnap = await getDoc(roomRef);
      const afterTurnData = afterTurnSnap.data() as FirestoreRoom;

      console.log(`  → After turn: P1=${afterTurnData.players[PLAYER_1_ID].integrity}, P2=${afterTurnData.players[PLAYER_2_ID].integrity}`);

      const victoryCheck = checkVictoryCondition(
        afterTurnData.players,
        afterTurnData.order_players
      );

      if (victoryCheck.hasWinner) {
        gameOver = true;
        const winnerName = victoryCheck.winnerId === PLAYER_1_ID ? 'Player 1' : 'Player 2';
        console.log(`\n🎉 GAME OVER! ${winnerName} wins by ${victoryCheck.reason}`);

        // ASSERT: Player 1 should win because Player 2 reached -3
        expect(victoryCheck.winnerId).toBe(PLAYER_1_ID);
        expect(victoryCheck.reason).toBe('opponent_defeated');
        expect(afterTurnData.players[PLAYER_2_ID].integrity).toBeLessThanOrEqual(-3);
      }
    }

    expect(gameOver).toBe(true);
  });

  it('should complete full game with reject/claim mechanics: multiplier affects victory', async () => {
    // ARRANGE: Game where strategic rejects lead to faster victory
    // All authentic cards (+1), but using reject (×3) speeds up victory
    const authenticDeck = Array(15).fill(null).map((_, i) =>
      createMockMemoryCard('authentic', `Memory ${i + 1}`)
    );

    await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
      turn_state: 'draw',
      turn: 0,
      memory_deck: authenticDeck,
      table_cards: authenticDeck.slice(0, 3),
      cards_drawn: 3
    });

    const roomRef = doc(db, 'rooms', ROOM_CODE);

    console.log('\n🎮 Starting E2E Game Test: Using REJECT mechanics for faster victory\n');

    // Turn 1: Player 1 selects and REJECTS (passes to Player 2)
    console.log('\n--- Turn 1: Player 1 ---');
    await selectCard(ROOM_CODE, 0, PLAYER_1_ID);
    console.log('  → Player 1 selected card');

    await rejectCard(ROOM_CODE, PLAYER_1_ID);
    console.log('  → Player 1 REJECTED (passes to Player 2 with ×3)');

    // Player 2 CLAIMS blind (gets +3 instead of +1)
    await opponentClaimCard(ROOM_CODE, PLAYER_2_ID);
    console.log('  → Player 2 CLAIMED blind (+3 points)');

    let roomSnap = await getDoc(roomRef);
    let roomData = roomSnap.data() as FirestoreRoom;
    console.log(`  → Scores: P1=${roomData.players[PLAYER_1_ID].integrity}, P2=${roomData.players[PLAYER_2_ID].integrity}`);

    // Turn 2: Player 2's normal turn
    console.log('\n--- Turn 2: Player 2 ---');
    await selectCard(ROOM_CODE, 0, PLAYER_2_ID);
    await claimCard(ROOM_CODE, PLAYER_2_ID);
    console.log('  → Player 2 claimed normally (+1 point)');

    roomSnap = await getDoc(roomRef);
    roomData = roomSnap.data() as FirestoreRoom;
    console.log(`  → Scores: P1=${roomData.players[PLAYER_1_ID].integrity}, P2=${roomData.players[PLAYER_2_ID].integrity}`);

    // Turn 3: Player 1 rejects again
    console.log('\n--- Turn 3: Player 1 ---');
    await selectCard(ROOM_CODE, 0, PLAYER_1_ID);
    await rejectCard(ROOM_CODE, PLAYER_1_ID);
    await opponentClaimCard(ROOM_CODE, PLAYER_2_ID);
    console.log('  → Another reject → Player 2 gets +3');

    roomSnap = await getDoc(roomRef);
    roomData = roomSnap.data() as FirestoreRoom;
    console.log(`  → Scores: P1=${roomData.players[PLAYER_1_ID].integrity}, P2=${roomData.players[PLAYER_2_ID].integrity}`);

    // Turn 4: Player 2 normal turn
    console.log('\n--- Turn 4: Player 2 ---');
    await selectCard(ROOM_CODE, 0, PLAYER_2_ID);
    await claimCard(ROOM_CODE, PLAYER_2_ID);

    roomSnap = await getDoc(roomRef);
    roomData = roomSnap.data() as FirestoreRoom;
    console.log(`  → Scores: P1=${roomData.players[PLAYER_1_ID].integrity}, P2=${roomData.players[PLAYER_2_ID].integrity}`);

    // Turn 5: Player 1 rejects one more time
    console.log('\n--- Turn 5: Player 1 ---');
    await selectCard(ROOM_CODE, 0, PLAYER_1_ID);
    await rejectCard(ROOM_CODE, PLAYER_1_ID);
    await opponentClaimCard(ROOM_CODE, PLAYER_2_ID);
    console.log('  → Final reject → Player 2 gets +3');

    roomSnap = await getDoc(roomRef);
    roomData = roomSnap.data() as FirestoreRoom;
    console.log(`  → Final Scores: P1=${roomData.players[PLAYER_1_ID].integrity}, P2=${roomData.players[PLAYER_2_ID].integrity}`);

    // ASSERT: Player 2 should have won with strategic rejects
    // 3 rejects (×3) + 1 normal = 3 + 3 + 3 + 1 = 10 points
    const victoryCheck = checkVictoryCondition(roomData.players, roomData.order_players);

    console.log(`\n🎉 Victory Check: hasWinner=${victoryCheck.hasWinner}, winner=${victoryCheck.winnerId}, reason=${victoryCheck.reason}`);

    expect(victoryCheck.hasWinner).toBe(true);
    expect(victoryCheck.winnerId).toBe(PLAYER_2_ID);
    expect(roomData.players[PLAYER_2_ID].integrity).toBeGreaterThanOrEqual(10);
    expect(roomData.players[PLAYER_1_ID].integrity).toBe(0); // Never claimed
  });
});
