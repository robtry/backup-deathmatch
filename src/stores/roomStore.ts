import { create } from 'zustand';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Room } from '@/types';
import { roomLogger } from '@/lib/utils/logger';

interface RoomState {
  room: Room | null;
  loading: boolean;
  error: string | null;
  unsubscribe: Unsubscribe | null;

  // Actions
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: () => void;
  createRoom: (userId: string, userName: string) => Promise<string>;
  joinRoom: (roomId: string, userId: string, userName: string) => Promise<void>;
  updateRoom: (roomId: string, updates: Partial<Room>) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  loading: false,
  error: null,
  unsubscribe: null,

  setError: (error) => set({ error }),

  subscribeToRoom: (roomId: string) => {
    // Unsubscribe from previous room if any
    const currentUnsubscribe = get().unsubscribe;
    if (currentUnsubscribe) {
      currentUnsubscribe();
    }

    set({ loading: true, error: null });

    const roomRef = doc(db, 'rooms', roomId);

    const unsubscribe = onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const room: Room = {
            id: docSnap.id,
            players: data.players || [],
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            finishedAt: data.finishedAt?.toDate() || null,
            lastUpdate: data.lastUpdate?.toDate() || new Date(),
            orderPlayers: data.order_players || [],
            turn: data.turn || 0,
            memoryDeck: data.memory_deck || [],
            currentCard: data.current_card || null,
            tableCards: data.table_cards || [],
            cardsDrawn: data.cards_drawn || 0,
            turnState: data.turn_state || 'draw',
            selectedCardIndex: data.selected_card_index ?? null,
            currentMultiplier: data.current_multiplier || 1,
            cardInitiator: data.card_initiator || null
          };

          set({ room, loading: false, error: null });
        } else {
          set({ room: null, loading: false, error: 'Sala no encontrada' });
        }
      },
      (error) => {
        roomLogger.error('Error subscribing to room', error);
        set({ loading: false, error: 'Error al conectar con la sala' });
      }
    );

    set({ unsubscribe });
  },

  unsubscribeFromRoom: () => {
    const unsubscribe = get().unsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null, room: null });
    }
  },

  createRoom: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const roomRef = doc(db, 'rooms', `room_${Date.now()}`);

      const newRoom: Omit<Room, 'id'> = {
        players: [
          {
            userId,
            integrity: 0,
            items: []
          }
        ],
        status: 'waiting',
        createdAt: new Date(),
        finishedAt: null,
        lastUpdate: new Date(),
        orderPlayers: [userId],
        turn: 0,
        memoryDeck: [],
        currentCard: null,
        tableCards: [],
        cardsDrawn: 0,
        turnState: 'draw',
        selectedCardIndex: null,
        currentMultiplier: 1,
        cardInitiator: null
      };

      await setDoc(roomRef, {
        ...newRoom,
        createdAt: Timestamp.fromDate(newRoom.createdAt),
        lastUpdate: Timestamp.fromDate(newRoom.lastUpdate)
      });

      // Update user's current_room
      await updateDoc(doc(db, 'users', userId), {
        current_room: roomRef.id
      });

      set({ loading: false, error: null });
      return roomRef.id;
    } catch (error) {
      roomLogger.error('Error creating room', error);
      set({ loading: false, error: 'Error al crear la sala' });
      throw error;
    }
  },

  joinRoom: async (roomId: string, userId: string) => {
    set({ loading: true, error: null });

    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Sala no encontrada');
      }

      const roomData = roomSnap.data();

      // Check if room is full (max 2 players)
      if (roomData.players.length >= 2) {
        throw new Error('La sala está llena');
      }

      // Check if user is already in the room
      if (roomData.players.some((p: any) => p.userId === userId)) {
        throw new Error('Ya estás en esta sala');
      }

      // Add player to room
      await updateDoc(roomRef, {
        players: [
          ...roomData.players,
          {
            userId,
            integrity: 0,
            items: []
          }
        ],
        order_players: [...roomData.order_players, userId],
        lastUpdate: Timestamp.now()
      });

      // Update user's current_room
      await updateDoc(doc(db, 'users', userId), {
        current_room: roomId
      });

      set({ loading: false, error: null });
    } catch (error: any) {
      roomLogger.error('Error joining room', error);
      set({ loading: false, error: error.message || 'Error al unirse a la sala' });
      throw error;
    }
  },

  updateRoom: async (roomId: string, updates: Partial<Room>) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);

      // Convert Date objects to Timestamps
      const firestoreUpdates: any = { ...updates };

      if (updates.lastUpdate) {
        firestoreUpdates.lastUpdate = Timestamp.fromDate(updates.lastUpdate);
      }

      if (updates.finishedAt) {
        firestoreUpdates.finishedAt = Timestamp.fromDate(updates.finishedAt);
      }

      await updateDoc(roomRef, firestoreUpdates);
    } catch (error) {
      roomLogger.error('Error updating room', error);
      throw error;
    }
  }
}));
