import {
  doc,
  getDoc,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { MemoryCard, FirestoreRoom, TurnState } from '@/types';
import { roomLogger } from '@/lib/utils/logger';

/**
 * Initializes the table cards with the first 3 cards from the memory deck
 * This is called when a game starts (status changes from 'intro' to 'playing')
 * @param memoryDeck - The complete memory deck (15 cards)
 * @returns The first 3 cards to display on the table
 * @throws Error if memory deck has less than 3 cards
 */
export const initializeTableCards = (memoryDeck: MemoryCard[]): MemoryCard[] => {
  roomLogger.debug('Initializing table cards', { deckSize: memoryDeck.length });

  if (memoryDeck.length < 3) {
    roomLogger.error('Cannot initialize table cards: insufficient cards in deck', {
      deckSize: memoryDeck.length
    });
    throw new Error('El mazo debe tener al menos 3 cartas para inicializar el tablero.');
  }

  // Take the first 3 cards from the deck
  const tableCards = memoryDeck.slice(0, 3);

  roomLogger.info('Table cards initialized', {
    tableCardsCount: tableCards.length,
    cardsDrawn: 3
  });

  return tableCards;
};

/**
 * Refreshes table cards after a card has been claimed or rejected
 * Removes the selected card from the table and replaces it with the next available card from the deck
 * @param currentTableCards - Current cards on the table (should be 3)
 * @param selectedCardIndex - Index of the card that was selected (0, 1, or 2)
 * @param memoryDeck - The complete memory deck
 * @param cardsDrawn - Number of cards already drawn from the deck
 * @returns Object with updated table cards and new cards drawn count
 */
export const refreshTableCards = (
  currentTableCards: MemoryCard[],
  selectedCardIndex: number,
  memoryDeck: MemoryCard[],
  cardsDrawn: number
): { tableCards: MemoryCard[]; newCardsDrawn: number } => {
  roomLogger.debug('Refreshing table cards', {
    currentTableCardsCount: currentTableCards.length,
    selectedCardIndex,
    cardsDrawn,
    remainingInDeck: memoryDeck.length - cardsDrawn
  });

  // Validate selected card index
  if (selectedCardIndex < 0 || selectedCardIndex >= currentTableCards.length) {
    roomLogger.error('Invalid card index for refresh', {
      selectedCardIndex,
      tableCardsCount: currentTableCards.length
    });
    throw new Error('Índice de carta inválido.');
  }

  // Create a copy of current table cards
  const newTableCards = [...currentTableCards];

  // Check if there are more cards available in the deck
  if (cardsDrawn < memoryDeck.length) {
    // Replace the selected card with the next card from the deck
    const nextCard = memoryDeck[cardsDrawn];
    newTableCards[selectedCardIndex] = nextCard;

    roomLogger.info('Table card replaced with new card from deck', {
      selectedCardIndex,
      cardsDrawn: cardsDrawn + 1,
      remainingInDeck: memoryDeck.length - (cardsDrawn + 1)
    });

    return {
      tableCards: newTableCards,
      newCardsDrawn: cardsDrawn + 1
    };
  } else {
    // No more cards in deck - remove the selected card from table
    newTableCards.splice(selectedCardIndex, 1);

    roomLogger.info('Table card removed, no cards left in deck', {
      selectedCardIndex,
      remainingTableCards: newTableCards.length,
      cardsDrawn
    });

    return {
      tableCards: newTableCards,
      newCardsDrawn: cardsDrawn
    };
  }
};

/**
 * Validates if the game can continue based on available cards
 * @param tableCards - Current cards on the table
 * @param memoryDeck - The complete memory deck
 * @param cardsDrawn - Number of cards already drawn
 * @returns True if game can continue (has cards on table), false otherwise
 */
export const canGameContinue = (
  tableCards: MemoryCard[],
  memoryDeck: MemoryCard[],
  cardsDrawn: number
): boolean => {
  const hasCardsOnTable = tableCards.length > 0;
  const hasCardsInDeck = cardsDrawn < memoryDeck.length;

  roomLogger.debug('Checking if game can continue', {
    hasCardsOnTable,
    hasCardsInDeck,
    tableCardsCount: tableCards.length,
    remainingInDeck: memoryDeck.length - cardsDrawn
  });

  return hasCardsOnTable || hasCardsInDeck;
};

/**
 * Gets the number of cards remaining in the game
 * @param tableCards - Current cards on the table
 * @param memoryDeck - The complete memory deck
 * @param cardsDrawn - Number of cards already drawn
 * @returns Total number of cards still available to play
 */
export const getRemainingCardsCount = (
  tableCards: MemoryCard[],
  memoryDeck: MemoryCard[],
  cardsDrawn: number
): number => {
  const cardsOnTable = tableCards.length;
  const cardsInDeck = memoryDeck.length - cardsDrawn;
  const total = cardsOnTable + cardsInDeck;

  roomLogger.debug('Calculating remaining cards', {
    cardsOnTable,
    cardsInDeck,
    total
  });

  return total;
};

/**
 * Checks if a player has won the game
 * Win condition: Player reaches +10 points
 * Lose condition: Player reaches -10 points or below
 * @param players - Players object with integrity values
 * @returns Object with winner info { hasWinner: boolean, winnerId: string | null, reason: string }
 */
export const checkVictoryCondition = (
  players: { [userId: string]: { integrity: number; items: any[] } },
  orderPlayers: string[]
): { hasWinner: boolean; winnerId: string | null; reason: string } => {
  roomLogger.debug('Checking victory condition', {
    player1Integrity: players[orderPlayers[0]]?.integrity,
    player2Integrity: players[orderPlayers[1]]?.integrity
  });

  // Check if any player reached +10 (victory)
  for (const playerId of orderPlayers) {
    if (players[playerId].integrity >= 10) {
      roomLogger.info('Victory detected: Player reached +10', {
        winnerId: playerId,
        integrity: players[playerId].integrity
      });
      return {
        hasWinner: true,
        winnerId: playerId,
        reason: 'reached_10_points'
      };
    }
  }

  // Check if any player reached -10 or below (defeat)
  for (const playerId of orderPlayers) {
    if (players[playerId].integrity <= -10) {
      // Winner is the OTHER player
      const winnerId = orderPlayers.find(id => id !== playerId)!;
      roomLogger.info('Victory detected: Player reached -10 or below', {
        loserId: playerId,
        loserIntegrity: players[playerId].integrity,
        winnerId,
        winnerIntegrity: players[winnerId].integrity
      });
      return {
        hasWinner: true,
        winnerId,
        reason: 'opponent_defeated'
      };
    }
  }

  return {
    hasWinner: false,
    winnerId: null,
    reason: ''
  };
};

/**
 * DRAW Phase: Player selects a card from the table
 * Moves the selected card to current_card and transitions to DECIDE phase
 * @param roomCode - The room code
 * @param cardIndex - Index of the card selected from table_cards (0, 1, or 2)
 * @param userId - The user ID of the player selecting the card
 * @returns Promise that resolves when card is selected
 * @throws Error if validation fails
 */
export const selectCard = async (
  roomCode: string,
  cardIndex: number,
  userId: string
): Promise<void> => {
  roomLogger.info('Player selecting card', { roomCode, cardIndex, userId });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);
      const roomSnap = await transaction.get(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('La sala no existe.');
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Validate room status is 'playing'
      if (roomData.status !== 'playing') {
        throw new Error('La partida no está en progreso.');
      }

      // Validate turn state is 'draw'
      if (roomData.turn_state !== 'draw') {
        throw new Error(`No puedes seleccionar una carta en este momento. Estado actual: ${roomData.turn_state}`);
      }

      // Validate it's the player's turn
      const currentPlayerIndex = roomData.turn;
      const currentPlayerId = roomData.order_players[currentPlayerIndex];

      if (currentPlayerId !== userId) {
        throw new Error('No es tu turno.');
      }

      // Validate card index
      if (cardIndex < 0 || cardIndex >= roomData.table_cards.length) {
        throw new Error('Índice de carta inválido.');
      }

      // Get the selected card
      const selectedCard = roomData.table_cards[cardIndex];

      // Update room: move card to current_card and change state to 'decide'
      transaction.update(roomRef, {
        current_card: selectedCard,
        selected_card_index: cardIndex,
        card_initiator: userId,
        turn_state: 'decide' as TurnState,
        current_multiplier: 1, // Reset multiplier to 1
        lastUpdate: Timestamp.now()
      });

      roomLogger.info('Card selected successfully', {
        roomCode,
        cardIndex,
        userId,
        newState: 'decide'
      });
    });
  } catch (error: any) {
    if (error instanceof Error) {
      roomLogger.error('Failed to select card', {
        roomCode,
        cardIndex,
        userId,
        message: error.message
      });
      throw error;
    }

    roomLogger.error('Unexpected error selecting card', { roomCode, cardIndex, userId, error });
    throw new Error('Error al seleccionar la carta.');
  }
};

/**
 * DECIDE Phase: Player claims the card (accepts it)
 * Player sees the card value and applies points × current_multiplier
 * Refreshes table cards and transitions to next turn
 * @param roomCode - The room code
 * @param userId - The user ID of the player claiming the card
 * @returns Promise that resolves when card is claimed
 * @throws Error if validation fails
 */
export const claimCard = async (
  roomCode: string,
  userId: string
): Promise<void> => {
  roomLogger.info('Player claiming card', { roomCode, userId });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);
      const roomSnap = await transaction.get(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('La sala no existe.');
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Validate room status is 'playing'
      if (roomData.status !== 'playing') {
        throw new Error('La partida no está en progreso.');
      }

      // Validate turn state is 'decide'
      if (roomData.turn_state !== 'decide') {
        throw new Error(`No puedes reclamar una carta en este momento. Estado actual: ${roomData.turn_state}`);
      }

      // Validate it's the player's turn (card initiator)
      if (roomData.card_initiator !== userId) {
        throw new Error('No puedes reclamar esta carta.');
      }

      // Validate current_card exists
      if (!roomData.current_card) {
        throw new Error('No hay carta seleccionada.');
      }

      // Calculate points with multiplier
      const points = roomData.current_card.value * roomData.current_multiplier;

      // Update player's integrity
      const updatedPlayers = { ...roomData.players };
      updatedPlayers[userId].integrity += points;

      // Refresh table cards
      const { tableCards, newCardsDrawn } = refreshTableCards(
        roomData.table_cards,
        roomData.selected_card_index!,
        roomData.memory_deck,
        roomData.cards_drawn
      );

      // Calculate next turn
      const nextTurn = (roomData.turn + 1) % roomData.order_players.length;

      // Add authentic memory to revealed_real_memories if it's authentic
      const updatedRevealedMemories = [...(roomData.revealed_real_memories || [])];
      if (roomData.current_card.authenticity === 'authentic') {
        updatedRevealedMemories.push(roomData.current_card.memory);
        roomLogger.info('Authentic memory added to revealed list', {
          memory: roomData.current_card.memory
        });
      }

      // Check victory condition
      const victoryCheck = checkVictoryCondition(updatedPlayers, roomData.order_players);

      if (victoryCheck.hasWinner) {
        // Game over - update room with winner info
        roomLogger.info('Game ended - victory condition met', {
          winnerId: victoryCheck.winnerId,
          reason: victoryCheck.reason
        });

        transaction.update(roomRef, {
          players: updatedPlayers,
          table_cards: tableCards,
          cards_drawn: newCardsDrawn,
          status: 'finished',
          winner: victoryCheck.winnerId,
          win_reason: victoryCheck.reason,
          finishedAt: Timestamp.now(),
          current_card: null,
          selected_card_index: null,
          current_multiplier: 1,
          card_initiator: null,
          revealed_real_memories: updatedRevealedMemories,
          lastUpdate: Timestamp.now()
        });
      } else {
        // Game continues - update room normally
        transaction.update(roomRef, {
          players: updatedPlayers,
          table_cards: tableCards,
          cards_drawn: newCardsDrawn,
          turn: nextTurn,
          turn_state: 'draw' as TurnState,
          current_card: null,
          selected_card_index: null,
          current_multiplier: 1,
          card_initiator: null,
          revealed_real_memories: updatedRevealedMemories,
          lastUpdate: Timestamp.now()
        });
      }

      roomLogger.info('Card claimed successfully', {
        roomCode,
        userId,
        points,
        multiplier: roomData.current_multiplier,
        newIntegrity: updatedPlayers[userId].integrity,
        nextTurn,
        tableCardsCount: tableCards.length
      });
    });
  } catch (error: any) {
    if (error instanceof Error) {
      roomLogger.error('Failed to claim card', {
        roomCode,
        userId,
        message: error.message
      });
      throw error;
    }

    roomLogger.error('Unexpected error claiming card', { roomCode, userId, error });
    throw new Error('Error al reclamar la carta.');
  }
};

/**
 * DECIDE Phase: Player rejects the card (passes to opponent)
 * Player does NOT see the card value
 * Transitions to OPPONENT_DECIDE phase with multiplier × 3
 * @param roomCode - The room code
 * @param userId - The user ID of the player rejecting the card
 * @returns Promise that resolves when card is rejected
 * @throws Error if validation fails
 */
export const rejectCard = async (
  roomCode: string,
  userId: string
): Promise<void> => {
  roomLogger.info('Player rejecting card', { roomCode, userId });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);
      const roomSnap = await transaction.get(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('La sala no existe.');
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Validate room status is 'playing'
      if (roomData.status !== 'playing') {
        throw new Error('La partida no está en progreso.');
      }

      // Validate turn state is 'decide'
      if (roomData.turn_state !== 'decide') {
        throw new Error(`No puedes rechazar una carta en este momento. Estado actual: ${roomData.turn_state}`);
      }

      // Validate it's the player's turn (card initiator)
      if (roomData.card_initiator !== userId) {
        throw new Error('No puedes rechazar esta carta.');
      }

      // Validate current_card exists
      if (!roomData.current_card) {
        throw new Error('No hay carta seleccionada.');
      }

      // Update room: change state to opponent_decide, increase multiplier to 3
      transaction.update(roomRef, {
        turn_state: 'opponent_decide' as TurnState,
        current_multiplier: 3, // Risk multiplier
        lastUpdate: Timestamp.now()
      });

      roomLogger.info('Card rejected, passed to opponent', {
        roomCode,
        userId,
        newState: 'opponent_decide',
        newMultiplier: 3
      });
    });
  } catch (error: any) {
    if (error instanceof Error) {
      roomLogger.error('Failed to reject card', {
        roomCode,
        userId,
        message: error.message
      });
      throw error;
    }

    roomLogger.error('Unexpected error rejecting card', { roomCode, userId, error });
    throw new Error('Error al rechazar la carta.');
  }
};

/**
 * OPPONENT_DECIDE Phase: Opponent claims the card (blind)
 * Opponent does NOT see the card before accepting
 * After accepting, card is revealed and points × 3 are applied
 * Refreshes table cards and transitions to next turn
 * @param roomCode - The room code
 * @param userId - The user ID of the opponent claiming the card
 * @returns Promise that resolves when card is claimed
 * @throws Error if validation fails
 */
export const opponentClaimCard = async (
  roomCode: string,
  userId: string
): Promise<void> => {
  roomLogger.info('Opponent claiming card (blind)', { roomCode, userId });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);
      const roomSnap = await transaction.get(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('La sala no existe.');
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Validate room status is 'playing'
      if (roomData.status !== 'playing') {
        throw new Error('La partida no está en progreso.');
      }

      // Validate turn state is 'opponent_decide'
      if (roomData.turn_state !== 'opponent_decide') {
        throw new Error(`No puedes reclamar en este momento. Estado actual: ${roomData.turn_state}`);
      }

      // Validate user is NOT the card initiator (must be opponent)
      if (roomData.card_initiator === userId) {
        throw new Error('No puedes reclamar tu propia carta rechazada.');
      }

      // Validate user is in the game
      if (!roomData.players[userId]) {
        throw new Error('No eres parte de esta partida.');
      }

      // Validate current_card exists
      if (!roomData.current_card) {
        throw new Error('No hay carta seleccionada.');
      }

      // Calculate points with multiplier (should be 3)
      const points = roomData.current_card.value * roomData.current_multiplier;

      // Update opponent's integrity
      const updatedPlayers = { ...roomData.players };
      updatedPlayers[userId].integrity += points;

      // Refresh table cards
      const { tableCards, newCardsDrawn } = refreshTableCards(
        roomData.table_cards,
        roomData.selected_card_index!,
        roomData.memory_deck,
        roomData.cards_drawn
      );

      // Calculate next turn
      const nextTurn = (roomData.turn + 1) % roomData.order_players.length;

      // Add authentic memory to revealed_real_memories if it's authentic
      const updatedRevealedMemories = [...(roomData.revealed_real_memories || [])];
      if (roomData.current_card.authenticity === 'authentic') {
        updatedRevealedMemories.push(roomData.current_card.memory);
        roomLogger.info('Authentic memory added to revealed list (opponent claim)', {
          memory: roomData.current_card.memory
        });
      }

      // Check victory condition
      const victoryCheck = checkVictoryCondition(updatedPlayers, roomData.order_players);

      if (victoryCheck.hasWinner) {
        // Game over - update room with winner info
        roomLogger.info('Game ended - victory condition met (opponent claim)', {
          winnerId: victoryCheck.winnerId,
          reason: victoryCheck.reason
        });

        transaction.update(roomRef, {
          players: updatedPlayers,
          table_cards: tableCards,
          cards_drawn: newCardsDrawn,
          status: 'finished',
          winner: victoryCheck.winnerId,
          win_reason: victoryCheck.reason,
          finishedAt: Timestamp.now(),
          current_card: null,
          selected_card_index: null,
          current_multiplier: 1,
          card_initiator: null,
          revealed_real_memories: updatedRevealedMemories,
          lastUpdate: Timestamp.now()
        });
      } else {
        // Game continues - update room normally
        transaction.update(roomRef, {
          players: updatedPlayers,
          table_cards: tableCards,
          cards_drawn: newCardsDrawn,
          turn: nextTurn,
          turn_state: 'draw' as TurnState,
          current_card: null,
          selected_card_index: null,
          current_multiplier: 1,
          card_initiator: null,
          revealed_real_memories: updatedRevealedMemories,
          lastUpdate: Timestamp.now()
        });
      }

      roomLogger.info('Opponent claimed card successfully (blind)', {
        roomCode,
        userId,
        points,
        multiplier: roomData.current_multiplier,
        newIntegrity: updatedPlayers[userId].integrity,
        nextTurn,
        tableCardsCount: tableCards.length
      });
    });
  } catch (error: any) {
    if (error instanceof Error) {
      roomLogger.error('Failed for opponent to claim card', {
        roomCode,
        userId,
        message: error.message
      });
      throw error;
    }

    roomLogger.error('Unexpected error for opponent claiming card', { roomCode, userId, error });
    throw new Error('Error al reclamar la carta.');
  }
};

/**
 * OPPONENT_DECIDE Phase: Opponent rejects back (forces card to original player)
 * Opponent does NOT see the card
 * Original player receives points × 3 FORCED (blind)
 * Refreshes table cards and transitions to next turn
 * @param roomCode - The room code
 * @param userId - The user ID of the opponent rejecting back
 * @returns Promise that resolves when card is forced back
 * @throws Error if validation fails
 */
export const opponentRejectBack = async (
  roomCode: string,
  userId: string
): Promise<void> => {
  roomLogger.info('Opponent rejecting card back (force)', { roomCode, userId });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);
      const roomSnap = await transaction.get(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('La sala no existe.');
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Validate room status is 'playing'
      if (roomData.status !== 'playing') {
        throw new Error('La partida no está en progreso.');
      }

      // Validate turn state is 'opponent_decide'
      if (roomData.turn_state !== 'opponent_decide') {
        throw new Error(`No puedes rechazar en este momento. Estado actual: ${roomData.turn_state}`);
      }

      // Validate user is NOT the card initiator (must be opponent)
      if (roomData.card_initiator === userId) {
        throw new Error('No puedes rechazar tu propia carta.');
      }

      // Validate user is in the game
      if (!roomData.players[userId]) {
        throw new Error('No eres parte de esta partida.');
      }

      // Validate current_card exists
      if (!roomData.current_card) {
        throw new Error('No hay carta seleccionada.');
      }

      // Validate card_initiator exists
      if (!roomData.card_initiator) {
        throw new Error('No hay jugador iniciador.');
      }

      // Calculate points with multiplier (should be 3) for ORIGINAL player
      const points = roomData.current_card.value * roomData.current_multiplier;

      // Update original player's integrity (card_initiator)
      const updatedPlayers = { ...roomData.players };
      updatedPlayers[roomData.card_initiator].integrity += points;

      // Refresh table cards
      const { tableCards, newCardsDrawn } = refreshTableCards(
        roomData.table_cards,
        roomData.selected_card_index!,
        roomData.memory_deck,
        roomData.cards_drawn
      );

      // Calculate next turn
      const nextTurn = (roomData.turn + 1) % roomData.order_players.length;

      // Add authentic memory to revealed_real_memories if it's authentic
      const updatedRevealedMemories = [...(roomData.revealed_real_memories || [])];
      if (roomData.current_card.authenticity === 'authentic') {
        updatedRevealedMemories.push(roomData.current_card.memory);
        roomLogger.info('Authentic memory added to revealed list (reject back)', {
          memory: roomData.current_card.memory
        });
      }

      // Check victory condition
      const victoryCheck = checkVictoryCondition(updatedPlayers, roomData.order_players);

      if (victoryCheck.hasWinner) {
        // Game over - update room with winner info
        roomLogger.info('Game ended - victory condition met (reject back)', {
          winnerId: victoryCheck.winnerId,
          reason: victoryCheck.reason
        });

        transaction.update(roomRef, {
          players: updatedPlayers,
          table_cards: tableCards,
          cards_drawn: newCardsDrawn,
          status: 'finished',
          winner: victoryCheck.winnerId,
          win_reason: victoryCheck.reason,
          finishedAt: Timestamp.now(),
          current_card: null,
          selected_card_index: null,
          current_multiplier: 1,
          card_initiator: null,
          revealed_real_memories: updatedRevealedMemories,
          lastUpdate: Timestamp.now()
        });
      } else {
        // Game continues - update room normally
        transaction.update(roomRef, {
          players: updatedPlayers,
          table_cards: tableCards,
          cards_drawn: newCardsDrawn,
          turn: nextTurn,
          turn_state: 'draw' as TurnState,
          current_card: null,
          selected_card_index: null,
          current_multiplier: 1,
          card_initiator: null,
          revealed_real_memories: updatedRevealedMemories,
          lastUpdate: Timestamp.now()
        });
      }

      roomLogger.info('Card rejected back, forced to original player', {
        roomCode,
        opponentId: userId,
        originalPlayerId: roomData.card_initiator,
        points,
        multiplier: roomData.current_multiplier,
        newIntegrity: updatedPlayers[roomData.card_initiator].integrity,
        nextTurn,
        tableCardsCount: tableCards.length
      });
    });
  } catch (error: any) {
    if (error instanceof Error) {
      roomLogger.error('Failed for opponent to reject back', {
        roomCode,
        userId,
        message: error.message
      });
      throw error;
    }

    roomLogger.error('Unexpected error for opponent rejecting back', { roomCode, userId, error });
    throw new Error('Error al rechazar la carta.');
  }
};
