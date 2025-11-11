import { customAlphabet } from 'nanoid';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { roomLogger } from '@/lib/utils/logger';
import { generateGameDeck } from './deckService';
import { initializeTableCards } from './gameService';
import type { FirestoreRoom, RoomStatus } from '@/types';

// Custom alphabet for room codes (no confusing characters: 0/O, 1/I)
const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROOM_CODE_LENGTH = 6;
const MAX_GENERATION_ATTEMPTS = 3;

const generateRoomCode = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);

/**
 * Generates a unique room code that doesn't already exist in Firestore
 * @returns Promise with the unique room code
 * @throws Error if unable to generate unique code after MAX_GENERATION_ATTEMPTS
 */
export const generateUniqueRoomCode = async (): Promise<string> => {
  roomLogger.info('Generating unique room code');

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const roomCode = generateRoomCode();
    roomLogger.debug(`Generated room code attempt ${attempt}`, { roomCode });

    // Check if room already exists
    const roomRef = doc(db, 'rooms', roomCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      roomLogger.info('Unique room code generated successfully', { roomCode, attempts: attempt });
      return roomCode;
    }

    roomLogger.warn('Room code collision detected, retrying', { roomCode, attempt });
  }

  const error = new Error('No se pudo generar un código de sala único. Intenta nuevamente.');
  roomLogger.error('Failed to generate unique room code after max attempts', { maxAttempts: MAX_GENERATION_ATTEMPTS });
  throw error;
};

/**
 * Creates a new game room in Firestore with initial state
 * @param userId - The ID of the user creating the room
 * @param roomCode - Optional custom room code (if not provided, generates unique one)
 * @returns Promise with the created room code
 * @throws Error if room creation fails
 */
export const createRoom = async (userId: string, roomCode?: string): Promise<string> => {
  roomLogger.info('Creating new room', { userId, customRoomCode: !!roomCode });

  try {
    // Generate unique room code if not provided
    const finalRoomCode = roomCode || await generateUniqueRoomCode();

    // Generate the game deck (15 random cards with authenticity)
    roomLogger.info('Generating game deck for new room', { roomCode: finalRoomCode });
    const memoryDeck = await generateGameDeck();
    roomLogger.info('Game deck generated', { roomCode: finalRoomCode, deckSize: memoryDeck.length });

    // Initialize table cards with first 3 cards from the deck
    const tableCards = initializeTableCards(memoryDeck);
    roomLogger.info('Table cards initialized', { roomCode: finalRoomCode, tableCardsCount: tableCards.length });

    // Use transaction to ensure atomicity (room creation + user update)
    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', finalRoomCode);
      const userRef = doc(db, 'users', userId);

      // Double-check room doesn't exist (in case of custom code)
      const roomSnap = await transaction.get(roomRef);
      if (roomSnap.exists()) {
        throw new Error('La sala ya existe. Intenta con otro código.');
      }

      // Verify user exists
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('Usuario no encontrado. Por favor inicia sesión nuevamente.');
      }

      // Prepare room data according to Firestore schema
      const now = Timestamp.now();
      const roomData: FirestoreRoom = {
        players: {
          [userId]: {
            integrity: 0, // Starting life points
            items: []
          }
        },
        status: 'waiting' as RoomStatus,
        createdAt: now,
        finishedAt: null,
        lastUpdate: now,
        order_players: [userId], // Creator is first player
        turn: 0, // First player's turn
        memory_deck: memoryDeck, // Populated with 15 random cards
        current_card: null,
        table_cards: tableCards, // First 3 cards visible on the table
        cards_drawn: 3, // 3 cards already drawn for the table
        turn_state: 'draw', // Initial state: waiting for card selection
        selected_card_index: null, // No card selected yet
        current_multiplier: 1, // Default multiplier
        card_initiator: null // No initiator yet
      };

      roomLogger.debug('Creating room document', {
        roomCode: finalRoomCode,
        deckSize: memoryDeck.length,
        status: roomData.status
      });

      // Create room document
      transaction.set(roomRef, roomData);

      // Update user's current_room field
      transaction.update(userRef, {
        current_room: finalRoomCode
      });

      roomLogger.info('Room created successfully', {
        roomCode: finalRoomCode,
        userId,
        status: 'waiting',
        deckCards: memoryDeck.length
      });

      return finalRoomCode;
    });

    return result;
  } catch (error: any) {
    // Handle Firestore transaction errors
    if (error.code === 'permission-denied') {
      roomLogger.error('Permission denied creating room', { userId, error });
      throw new Error('No tienes permisos para crear una sala.');
    }

    if (error.code === 'unavailable') {
      roomLogger.error('Firestore unavailable', { error });
      throw new Error('Servicio no disponible. Verifica tu conexión.');
    }

    // Re-throw custom errors
    if (error instanceof Error) {
      roomLogger.error('Room creation failed', { userId, message: error.message });
      throw error;
    }

    // Generic error
    roomLogger.error('Unexpected error creating room', { userId, error });
    throw new Error('Error al crear la sala. Intenta nuevamente.');
  }
};

/**
 * Checks if a room exists in Firestore
 * @param roomCode - The room code to check
 * @returns Promise with boolean indicating if room exists
 */
export const roomExists = async (roomCode: string): Promise<boolean> => {
  try {
    const roomRef = doc(db, 'rooms', roomCode);
    const roomSnap = await getDoc(roomRef);
    return roomSnap.exists();
  } catch (error) {
    roomLogger.error('Error checking room existence', { roomCode, error });
    return false;
  }
};

/**
 * Gets room data from Firestore
 * @param roomCode - The room code to fetch
 * @returns Promise with room data or null if not found
 */
export const getRoom = async (roomCode: string): Promise<FirestoreRoom | null> => {
  try {
    roomLogger.debug('Fetching room data', { roomCode });
    const roomRef = doc(db, 'rooms', roomCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      roomLogger.warn('Room not found', { roomCode });
      return null;
    }

    const roomData = roomSnap.data() as FirestoreRoom;
    roomLogger.debug('Room data fetched successfully', { roomCode, status: roomData.status });
    return roomData;
  } catch (error) {
    roomLogger.error('Error fetching room data', { roomCode, error });
    throw new Error('Error al obtener datos de la sala.');
  }
};

/**
 * Updates user's current_room field in Firestore
 * @param userId - The user ID to update
 * @param roomCode - The room code to set (null to clear)
 * @returns Promise that resolves when update is complete
 */
export const updateUserCurrentRoom = async (
  userId: string,
  roomCode: string | null
): Promise<void> => {
  try {
    roomLogger.debug('Updating user current room', { userId, roomCode });
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      current_room: roomCode
    });
    roomLogger.info('User current room updated', { userId, roomCode });
  } catch (error) {
    roomLogger.error('Error updating user current room', { userId, roomCode, error });
    throw new Error('Error al actualizar sala del usuario.');
  }
};

/**
 * Joins an existing room (adds player to room)
 * @param userId - The ID of the user joining
 * @param roomCode - The room code to join
 * @returns Promise that resolves when join is complete
 * @throws Error if room is full, doesn't exist, or join fails
 */
export const joinRoom = async (userId: string, roomCode: string): Promise<void> => {
  roomLogger.info('User attempting to join room', { userId, roomCode });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);
      const userRef = doc(db, 'users', userId);

      // Get room data
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('La sala no existe.');
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Check if room is full (max 2 players)
      const playerCount = Object.keys(roomData.players).length;
      if (playerCount >= 2) {
        throw new Error('La sala está llena (máximo 2 jugadores).');
      }

      // Check if user is already in the room
      if (roomData.players[userId]) {
        roomLogger.warn('User already in room', { userId, roomCode });
        throw new Error('Ya estás en esta sala.');
      }

      // Check if room has already started
      if (roomData.status !== 'waiting') {
        throw new Error('La partida ya ha comenzado.');
      }

      // Add player to room
      transaction.update(roomRef, {
        [`players.${userId}`]: {
          integrity: 0,
          items: []
        },
        order_players: [...roomData.order_players, userId],
        lastUpdate: Timestamp.now()
      });

      // Update user's current_room
      transaction.update(userRef, {
        current_room: roomCode
      });

      roomLogger.info('User joined room successfully', { userId, roomCode, playerCount: playerCount + 1 });
    });
  } catch (error: any) {
    if (error instanceof Error) {
      roomLogger.error('Failed to join room', { userId, roomCode, message: error.message });
      throw error;
    }
    roomLogger.error('Unexpected error joining room', { userId, roomCode, error });
    throw new Error('Error al unirse a la sala.');
  }
};

/**
 * Leaves a room (removes player from room)
 * @param userId - The ID of the user leaving
 * @param roomCode - The room code to leave
 * @returns Promise that resolves when leave is complete
 */
export const leaveRoom = async (userId: string, roomCode: string): Promise<void> => {
  roomLogger.info('User leaving room', { userId, roomCode });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);
      const userRef = doc(db, 'users', userId);

      // Get room data
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        roomLogger.warn('Room does not exist when leaving', { userId, roomCode });
        // Still clear user's current_room
        transaction.update(userRef, { current_room: null });
        return;
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Remove player from room
      const updatedPlayers = { ...roomData.players };
      delete updatedPlayers[userId];

      const updatedOrderPlayers = roomData.order_players.filter(id => id !== userId);
      const remainingPlayersCount = updatedOrderPlayers.length;

      // If room is in 'waiting' status and no players left, delete the room
      if (roomData.status === 'waiting' && remainingPlayersCount === 0) {
        roomLogger.info('Deleting empty waiting room', { userId, roomCode });
        transaction.delete(roomRef);
      }
      // If players remain, just update the room
      else if (remainingPlayersCount > 0) {
        transaction.update(roomRef, {
          players: updatedPlayers,
          order_players: updatedOrderPlayers,
          lastUpdate: Timestamp.now()
        });
        roomLogger.info('Player removed from room', { userId, roomCode, remainingPlayers: remainingPlayersCount });
      }
      // If no players left in active game, mark as finished (don't delete)
      else {
        transaction.update(roomRef, {
          players: updatedPlayers,
          order_players: updatedOrderPlayers,
          status: 'finished' as RoomStatus,
          finishedAt: Timestamp.now(),
          lastUpdate: Timestamp.now()
        });
        roomLogger.info('Game ended due to player leaving', { userId, roomCode });
      }

      // Clear user's current_room
      transaction.update(userRef, {
        current_room: null
      });

      roomLogger.info('User left room successfully', { userId, roomCode });
    });
  } catch (error) {
    roomLogger.error('Error leaving room', { userId, roomCode, error });
    throw new Error('Error al salir de la sala.');
  }
};

/**
 * Starts a game by changing room status from 'waiting' to 'intro'
 * Only the room creator (first player in order_players) can start the game
 * @param userId - The ID of the user attempting to start the game
 * @param roomCode - The room code to start
 * @returns Promise that resolves when game is started
 * @throws Error if validation fails or user doesn't have permission
 */
export const startGame = async (userId: string, roomCode: string): Promise<void> => {
  roomLogger.info('User attempting to start game', { userId, roomCode });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);

      // Get room data
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('La sala no existe.');
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Validate room status is 'waiting'
      if (roomData.status !== 'waiting') {
        throw new Error('La partida ya ha comenzado o ha finalizado.');
      }

      // Validate exactly 2 players
      const playerCount = Object.keys(roomData.players).length;
      if (playerCount !== 2) {
        throw new Error('Se necesitan exactamente 2 jugadores para iniciar la partida.');
      }

      // Validate user is the creator (first in order_players)
      const creatorId = roomData.order_players[0];
      if (creatorId !== userId) {
        throw new Error('Solo el creador de la sala puede iniciar la partida.');
      }

      // Update room status to 'intro'
      transaction.update(roomRef, {
        status: 'intro' as RoomStatus,
        lastUpdate: Timestamp.now()
      });

      roomLogger.info('Game started successfully', {
        userId,
        roomCode,
        playerCount,
        newStatus: 'intro'
      });
    });
  } catch (error: any) {
    // Handle transaction errors
    if (error instanceof Error) {
      roomLogger.error('Failed to start game', {
        userId,
        roomCode,
        message: error.message
      });
      throw error;
    }

    // Generic error
    roomLogger.error('Unexpected error starting game', { userId, roomCode, error });
    throw new Error('Error al iniciar la partida.');
  }
};

/**
 * Completes the intro phase by changing room status from 'intro' to 'playing'
 * Any player in the room can complete the intro (both see the same intro screen)
 * @param roomCode - The room code to transition to playing
 * @returns Promise that resolves when intro is completed
 * @throws Error if room doesn't exist or status is not 'intro'
 */
export const completeIntro = async (roomCode: string): Promise<void> => {
  roomLogger.info('Attempting to complete intro', { roomCode });

  try {
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomCode);

      // Get room data
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('La sala no existe.');
      }

      const roomData = roomSnap.data() as FirestoreRoom;

      // Validate room status is 'intro'
      if (roomData.status !== 'intro') {
        throw new Error('La intro no está en progreso. Status actual: ' + roomData.status);
      }

      // Update room status to 'playing'
      transaction.update(roomRef, {
        status: 'playing' as RoomStatus,
        lastUpdate: Timestamp.now()
      });

      roomLogger.info('Intro completed successfully', {
        roomCode,
        previousStatus: 'intro',
        newStatus: 'playing'
      });
    });
  } catch (error: any) {
    // Handle transaction errors
    if (error instanceof Error) {
      roomLogger.error('Failed to complete intro', {
        roomCode,
        message: error.message
      });
      throw error;
    }

    // Generic error
    roomLogger.error('Unexpected error completing intro', { roomCode, error });
    throw new Error('Error al completar la introducción.');
  }
};
