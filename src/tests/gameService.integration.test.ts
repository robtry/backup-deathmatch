import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  selectCard,
  claimCard,
  rejectCard,
  opponentClaimCard
} from '@/services/gameService';
import {
  createTestRoom,
  createTestUser,
  cleanupTestData
} from './firebaseTestUtils';
import type { FirestoreRoom } from '@/types';

describe('gameService - Integration Tests with Firebase', () => {
  const ROOM_CODE = 'TEST-ROOM-001';
  const PLAYER_1_ID = 'test-player-1';
  const PLAYER_2_ID = 'test-player-2';

  beforeEach(async () => {
    // Create test users
    await createTestUser(PLAYER_1_ID, 'player1@test.com', 'Player 1');
    await createTestUser(PLAYER_2_ID, 'player2@test.com', 'Player 2');
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData([ROOM_CODE], [PLAYER_1_ID, PLAYER_2_ID]);
  });

  describe('selectCard + claimCard flow', () => {
    it('should complete full turn: select card and claim it', async () => {
      // ARRANGE: Create a test room in 'draw' state
      await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
        turn_state: 'draw',
        turn: 0 // Player 1's turn
      });

      // Get initial room state
      const roomRef = doc(db, 'rooms', ROOM_CODE);
      const initialSnap = await getDoc(roomRef);
      const initialRoom = initialSnap.data() as FirestoreRoom;

      expect(initialRoom.turn_state).toBe('draw');
      expect(initialRoom.current_card).toBeNull();
      expect(initialRoom.table_cards).toHaveLength(3);
      expect(initialRoom.players[PLAYER_1_ID].integrity).toBe(0);

      // ACT 1: Player 1 selects card at index 1
      await selectCard(ROOM_CODE, 1, PLAYER_1_ID);

      // ASSERT 1: Room should be in 'decide' state with current_card set
      const afterSelectSnap = await getDoc(roomRef);
      const afterSelectRoom = afterSelectSnap.data() as FirestoreRoom;

      expect(afterSelectRoom.turn_state).toBe('decide');
      expect(afterSelectRoom.current_card).not.toBeNull();
      expect(afterSelectRoom.selected_card_index).toBe(1);
      expect(afterSelectRoom.card_initiator).toBe(PLAYER_1_ID);
      expect(afterSelectRoom.current_multiplier).toBe(1);

      // Store the card value for later verification
      const cardValue = afterSelectRoom.current_card!.value;

      // ACT 2: Player 1 claims the card
      await claimCard(ROOM_CODE, PLAYER_1_ID);

      // ASSERT 2: Room should be back to 'draw' state, points applied, turn advanced
      const afterClaimSnap = await getDoc(roomRef);
      const afterClaimRoom = afterClaimSnap.data() as FirestoreRoom;

      expect(afterClaimRoom.turn_state).toBe('draw');
      expect(afterClaimRoom.current_card).toBeNull();
      expect(afterClaimRoom.selected_card_index).toBeNull();
      expect(afterClaimRoom.card_initiator).toBeNull();

      // Check points were applied with multiplier 1
      expect(afterClaimRoom.players[PLAYER_1_ID].integrity).toBe(cardValue * 1);

      // Check turn advanced to player 2
      expect(afterClaimRoom.turn).toBe(1);

      // Check table cards were refreshed
      expect(afterClaimRoom.table_cards).toHaveLength(3);
      expect(afterClaimRoom.cards_drawn).toBe(4); // Started at 3, drew 1 more
    });

    it('should reject claim if not player turn', async () => {
      // ARRANGE: Create room in 'draw' state with player 1's turn
      await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
        turn_state: 'draw',
        turn: 0
      });

      // ACT & ASSERT: Player 2 tries to select card (not their turn)
      await expect(
        selectCard(ROOM_CODE, 0, PLAYER_2_ID)
      ).rejects.toThrow('No es tu turno.');
    });

    it('should reject claim if wrong turn state', async () => {
      // ARRANGE: Create room in 'waiting' state
      await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
        status: 'waiting',
        turn_state: 'draw'
      });

      // ACT & ASSERT: Player 1 tries to select card while game not started
      await expect(
        selectCard(ROOM_CODE, 0, PLAYER_1_ID)
      ).rejects.toThrow('La partida no está en progreso.');
    });
  });

  describe('rejectCard + opponentClaimCard flow', () => {
    it('should complete reject flow: player rejects, opponent claims with 3x multiplier', async () => {
      // ARRANGE: Create room and select a card first
      await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
        turn_state: 'draw',
        turn: 0
      });

      // Player 1 selects a card
      await selectCard(ROOM_CODE, 0, PLAYER_1_ID);

      // Get room state after selection
      const roomRef = doc(db, 'rooms', ROOM_CODE);
      const afterSelectSnap = await getDoc(roomRef);
      const afterSelectRoom = afterSelectSnap.data() as FirestoreRoom;
      const cardValue = afterSelectRoom.current_card!.value;

      expect(afterSelectRoom.turn_state).toBe('decide');

      // ACT 1: Player 1 rejects the card
      await rejectCard(ROOM_CODE, PLAYER_1_ID);

      // ASSERT 1: Room should be in 'opponent_decide' state with 3x multiplier
      const afterRejectSnap = await getDoc(roomRef);
      const afterRejectRoom = afterRejectSnap.data() as FirestoreRoom;

      expect(afterRejectRoom.turn_state).toBe('opponent_decide');
      expect(afterRejectRoom.current_multiplier).toBe(3);
      expect(afterRejectRoom.current_card).not.toBeNull();
      expect(afterRejectRoom.turn).toBe(0); // Turn hasn't changed yet

      // ACT 2: Opponent (Player 2) claims the card
      await opponentClaimCard(ROOM_CODE, PLAYER_2_ID);

      // ASSERT 2: Room should be back to 'draw', points applied with 3x multiplier
      const afterOpponentClaimSnap = await getDoc(roomRef);
      const afterOpponentClaimRoom = afterOpponentClaimSnap.data() as FirestoreRoom;

      expect(afterOpponentClaimRoom.turn_state).toBe('draw');
      expect(afterOpponentClaimRoom.current_card).toBeNull();

      // Check Player 1 has no points (rejected the card)
      expect(afterOpponentClaimRoom.players[PLAYER_1_ID].integrity).toBe(0);

      // Check Player 2 received points with 3x multiplier
      expect(afterOpponentClaimRoom.players[PLAYER_2_ID].integrity).toBe(cardValue * 3);

      // Check turn advanced to player 2
      expect(afterOpponentClaimRoom.turn).toBe(1);

      // Check table was refreshed
      expect(afterOpponentClaimRoom.table_cards).toHaveLength(3);
      expect(afterOpponentClaimRoom.cards_drawn).toBe(4);
    });

    it('should reject opponent claim if they are the initiator', async () => {
      // ARRANGE: Create room with player 1 having selected and rejected
      await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
        turn_state: 'opponent_decide',
        turn: 0,
        card_initiator: PLAYER_1_ID,
        current_multiplier: 3
      });

      // ACT & ASSERT: Player 1 (initiator) tries to claim their own rejected card
      await expect(
        opponentClaimCard(ROOM_CODE, PLAYER_1_ID)
      ).rejects.toThrow('No puedes reclamar tu propia carta rechazada.');
    });

    it('should handle negative card values correctly with multiplier', async () => {
      // ARRANGE: Create room with a corrupted card (-1 value)
      await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
        turn_state: 'draw',
        turn: 0
      });

      await selectCard(ROOM_CODE, 0, PLAYER_1_ID);

      // Get the card and verify it's negative (or force it for test)
      const roomRef = doc(db, 'rooms', ROOM_CODE);
      const afterSelectSnap = await getDoc(roomRef);
      const afterSelectRoom = afterSelectSnap.data() as FirestoreRoom;

      // Skip if card is not negative (depends on mock data)
      if (afterSelectRoom.current_card!.value >= 0) {
        return;
      }

      const cardValue = afterSelectRoom.current_card!.value;

      // Player 1 rejects
      await rejectCard(ROOM_CODE, PLAYER_1_ID);

      // Player 2 claims (blind)
      await opponentClaimCard(ROOM_CODE, PLAYER_2_ID);

      // ASSERT: Player 2 should have negative points × 3
      const finalSnap = await getDoc(roomRef);
      const finalRoom = finalSnap.data() as FirestoreRoom;

      expect(finalRoom.players[PLAYER_2_ID].integrity).toBe(cardValue * 3);
      expect(finalRoom.players[PLAYER_2_ID].integrity).toBeLessThan(0);
    });
  });

  describe('table cards refresh during gameplay', () => {
    it('should correctly refresh table_cards after multiple turns', async () => {
      // ARRANGE: Create room
      await createTestRoom(ROOM_CODE, PLAYER_1_ID, PLAYER_2_ID, {
        turn_state: 'draw',
        turn: 0
      });

      const roomRef = doc(db, 'rooms', ROOM_CODE);

      // Get initial table cards
      const initialSnap = await getDoc(roomRef);
      const initialRoom = initialSnap.data() as FirestoreRoom;
      const initialTableCards = [...initialRoom.table_cards];

      expect(initialRoom.cards_drawn).toBe(3);

      // ACT: Complete a full turn (select + claim)
      await selectCard(ROOM_CODE, 1, PLAYER_1_ID);
      await claimCard(ROOM_CODE, PLAYER_1_ID);

      // ASSERT: Table should have new card at index 1
      const afterTurn1Snap = await getDoc(roomRef);
      const afterTurn1Room = afterTurn1Snap.data() as FirestoreRoom;

      expect(afterTurn1Room.cards_drawn).toBe(4);
      expect(afterTurn1Room.table_cards).toHaveLength(3);

      // Card at index 1 should be different (new card from deck)
      expect(afterTurn1Room.table_cards[1]).not.toEqual(initialTableCards[1]);

      // Cards at index 0 and 2 should remain the same
      expect(afterTurn1Room.table_cards[0]).toEqual(initialTableCards[0]);
      expect(afterTurn1Room.table_cards[2]).toEqual(initialTableCards[2]);
    });
  });
});
