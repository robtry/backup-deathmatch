import { doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FirestoreRoom } from '@/types';
import { createMockRoom } from './testUtils';

/**
 * Creates a test room in Firebase emulator
 * Returns the room code for testing
 */
export const createTestRoom = async (
  roomCode: string,
  player1Id: string = 'test-player-1',
  player2Id: string = 'test-player-2',
  overrides?: Partial<FirestoreRoom>
): Promise<string> => {
  const roomData = createMockRoom(player1Id, player2Id, overrides);

  // Convert Date objects to Timestamps for Firestore
  const firestoreData = {
    ...roomData,
    createdAt: Timestamp.fromDate(roomData.createdAt as Date),
    lastUpdate: Timestamp.fromDate(roomData.lastUpdate as Date),
    finishedAt: roomData.finishedAt ? Timestamp.fromDate(roomData.finishedAt as Date) : null
  };

  const roomRef = doc(db, 'rooms', roomCode);
  await setDoc(roomRef, firestoreData);

  return roomCode;
};

/**
 * Deletes a test room from Firebase emulator
 */
export const deleteTestRoom = async (roomCode: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomCode);
  await deleteDoc(roomRef);
};

/**
 * Creates test users in Firebase emulator
 */
export const createTestUser = async (
  userId: string,
  email: string = `${userId}@test.com`,
  name: string = `Test User ${userId}`
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    email,
    name,
    current_room: null
  });
};

/**
 * Deletes a test user from Firebase emulator
 */
export const deleteTestUser = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
};

/**
 * Cleans up all test data (rooms and users)
 */
export const cleanupTestData = async (
  roomCodes: string[],
  userIds: string[]
): Promise<void> => {
  const deletePromises = [
    ...roomCodes.map(code => deleteTestRoom(code)),
    ...userIds.map(id => deleteTestUser(id))
  ];

  await Promise.all(deletePromises);
};
