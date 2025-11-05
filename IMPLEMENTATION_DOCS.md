# Firebase Room Creation and Security Implementation

## Overview

This document explains the implementation of two critical Firebase features:
1. Room Creation with nanoid-generated unique codes
2. Comprehensive Firebase Security Rules for production-ready security

## 1. Room Creation Implementation

### Installation

Installed `nanoid` package for generating human-readable, collision-resistant room codes:
```bash
pnpm add nanoid
```

### Room Code Generation

**File**: `/src/services/roomService.ts`

- **Custom Alphabet**: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`
  - Excludes confusing characters: 0/O, 1/I
  - Easy to read and communicate over voice/text

- **Code Length**: 6 characters (e.g., "K3M7N9", "5CWACH")
  - Provides 1,073,741,824 possible combinations
  - Extremely low collision probability

- **Collision Detection**:
  - Checks Firestore if room code already exists
  - Retries up to 3 times if collision detected
  - Throws error if unable to generate unique code

### Room Creation Flow

**Function**: `createRoom(userId: string, roomCode?: string)`

1. **Generate Unique Code**: Uses nanoid custom alphabet or accepts custom code
2. **Atomic Transaction**: Uses `runTransaction()` for data consistency
3. **Create Room Document**:
   ```typescript
   {
     players: {
       [userId]: {
         integrity: 0,
         items: []
       }
     },
     status: 'waiting',
     createdAt: Timestamp.now(),
     finishedAt: null,
     lastUpdate: Timestamp.now(),
     order_players: [userId],
     turn: 0,
     memory_deck: [],
     current_card: null
   }
   ```
4. **Update User**: Sets user's `current_room` field to room code
5. **Return Room Code**: Returns the generated code for navigation

### Room Service Functions

**Exported Functions**:

- `generateUniqueRoomCode()`: Generates collision-free room code
- `createRoom(userId, roomCode?)`: Creates new room with atomic transaction
- `roomExists(roomCode)`: Checks if room exists
- `getRoom(roomCode)`: Fetches room data
- `updateUserCurrentRoom(userId, roomCode)`: Updates user's current room
- `joinRoom(userId, roomCode)`: Adds player to existing room
- `leaveRoom(userId, roomCode)`: Removes player from room

### TypeScript Types

**File**: `/src/types/index.ts`

Added Firestore-specific types that match the database schema:

```typescript
// Firestore uses snake_case for field names
export interface FirestoreRoom {
  players: {
    [userId: string]: FirestorePlayer;
  };
  status: RoomStatus;
  createdAt: any; // Firebase Timestamp
  finishedAt: any | null;
  lastUpdate: any;
  order_players: string[];
  turn: number;
  memory_deck: FirestoreMemoryDeckCard[];
  current_card: MemoryCard | null;
}
```

### Main Menu Integration

**File**: `/src/pages/MainMenuPage.tsx`

Updated to use the new room service:

- **Loading State**: Shows "CREANDO SALA..." while creating
- **Error Handling**: Displays user-friendly error messages
- **Async/Await**: Proper async handling with try-catch
- **Navigation**: Redirects to `/game/{roomCode}` on success
- **Disabled State**: Disables all buttons during room creation

## 2. Firebase Security Rules

**File**: `/firestore.rules`

### Security Model

Comprehensive security rules with three levels of protection:
1. **Authentication**: Only authenticated users can access data
2. **Authorization**: Users can only access their own data or rooms they're in
3. **Validation**: Strict data structure and game logic validation

### Helper Functions

**Authentication Helpers**:
- `isAuthenticated()`: Checks if user is logged in
- `isOwner(userId)`: Verifies user owns the document
- `isPlayerInRoom(roomData)`: Checks if user is a player in the room
- `isPlayerTurn(roomData)`: Validates it's the user's turn

**Validation Helpers**:
- `isValidStatusTransition()`: Validates game state transitions
- `hasValidRoomStructure()`: Ensures all required fields are present
- `hasValidStatus()`: Validates status enum values
- `hasValidPlayerStructure()`: Validates player data structure
- `onlyAllowedFieldsModified()`: Prevents tampering with restricted fields

### Users Collection Security

**Path**: `/users/{userId}`

**Read**: Users can only read their own document
**Create**: Users can create their own document with required fields
**Update**: Users can update their own data (except email)
**Delete**: Disabled (must be done server-side)

**Validation**:
- Email cannot be changed after creation
- current_room must be string or null
- All required fields must be present

### Rooms Collection Security

**Path**: `/rooms/{roomId}`

**Read**: Any authenticated user can read rooms (for joining)
**Create**: Authenticated users can create rooms with strict validation
**Update**: Only players in the room can update
**Delete**: Disabled (must be done server-side)

### Room Creation Validation

When creating a room, the security rules enforce:

1. User must be authenticated
2. Room must have all required fields
3. Status must be 'waiting'
4. Creator must be the only player
5. Creator's player data must be valid structure
6. order_players must contain only creator
7. turn must be 0
8. memory_deck must be empty
9. current_card must be null
10. All timestamps must be set correctly

### Room Update Validation

**Scenario 1: Player Joining** (status: 'waiting')
- Players count increases by 1
- Maximum 2 players allowed
- Can only modify: players, order_players, lastUpdate

**Scenario 2: Starting Game** (waiting → intro → playing)
- Must have exactly 2 players
- Can only modify: status, memory_deck, lastUpdate

**Scenario 3: Making Game Move** (status: 'playing')
- Must be the player's turn
- Turn must increment correctly
- Integrity changes must be within bounds (-3 to +3 per turn)
- Memory deck size must decrease by 1 (card drawn)
- Can only modify: turn, current_card, memory_deck, players, lastUpdate

**Scenario 4: Ending Game** (playing → finished)
- finishedAt timestamp must be set
- Can only modify: status, finishedAt, lastUpdate

**Scenario 5: Leaving Room**
- Player removes themselves from players map
- Can only modify: players, order_players, lastUpdate

### Integrity Validation

To prevent cheating, the rules validate:

1. **Turn-based Updates**: Only the active player can make moves
2. **Bounded Changes**: Integrity can only change by -3 to +3 per turn
3. **Valid Targets**: Players can only modify their own or opponent's integrity
4. **Atomic Transactions**: All game moves must update turn, deck, and integrity together

### Decks Collection Security

**Path**: `/decks/{deckId}`

**Read**: Authenticated users can read predefined decks
**Write**: Disabled (decks are managed server-side)

## Testing the Implementation

### Manual Testing Steps

1. **Test Room Creation**:
   - Login to application
   - Click "CREAR SALA"
   - Verify unique 6-character code is generated
   - Verify navigation to `/game/{roomCode}`
   - Check Firestore to confirm room document created

2. **Test Security Rules** (in Firebase Emulator UI):
   - Try to create room without authentication (should fail)
   - Try to create room with invalid status (should fail)
   - Try to update another user's document (should fail)
   - Try to join room as second player (should succeed)
   - Try to make move when not your turn (should fail)

3. **Test Error Handling**:
   - Disconnect from Firebase emulators
   - Try to create room (should show error message)
   - Verify buttons are disabled during creation

### Firestore Emulator Console

Access at: `http://localhost:4000/firestore`

You can inspect:
- Room documents in `/rooms` collection
- User documents in `/users` collection
- Security rule evaluations in the Rules Playground

## Error Handling

All service functions include comprehensive error handling:

1. **Permission Denied**: "No tienes permisos para crear una sala"
2. **Room Already Exists**: "La sala ya existe. Intenta con otro código"
3. **User Not Found**: "Usuario no encontrado. Por favor inicia sesión nuevamente"
4. **Service Unavailable**: "Servicio no disponible. Verifica tu conexión"
5. **Room Full**: "La sala está llena (máximo 2 jugadores)"
6. **Already in Room**: "Ya estás en esta sala"
7. **Game Started**: "La partida ya ha comenzado"

## Logging

All operations are logged using the `roomLogger` from `/src/lib/utils/logger.ts`:

- **info**: High-level operations (room created, player joined)
- **debug**: Detailed data (room codes, player counts)
- **warn**: Potential issues (collisions, room not found)
- **error**: Failures (permission denied, transaction errors)

Logs are automatically disabled in production.

## Next Steps

### Recommended Enhancements

1. **Room Expiration**: Add Cloud Function to clean up abandoned rooms
2. **Player Reconnection**: Handle network disconnections gracefully
3. **Spectator Mode**: Allow users to watch ongoing games
4. **Room Passwords**: Add optional password protection
5. **Rate Limiting**: Prevent users from creating too many rooms
6. **Analytics**: Track room creation success rate and errors

### Implementation Checklist

- [x] Install nanoid package
- [x] Create TypeScript interfaces for Firestore data
- [x] Implement room creation service with transactions
- [x] Update MainMenuPage to use service
- [x] Design comprehensive security rules
- [x] Test room creation in browser
- [ ] Implement join room functionality (JoinRoomDialog)
- [ ] Add real-time room listener hook
- [ ] Implement game state synchronization
- [ ] Add leave room functionality
- [ ] Create room cleanup Cloud Function

## Security Best Practices Applied

1. **Principle of Least Privilege**: Users can only access their own data
2. **Defense in Depth**: Multiple layers of validation (auth, structure, game logic)
3. **Data Integrity**: Atomic transactions prevent race conditions
4. **Input Validation**: All data structures validated before write
5. **Rate Limiting**: Consider adding client-side debouncing
6. **Audit Trail**: Comprehensive logging for debugging
7. **Fail Secure**: Rules deny by default, allow explicitly

## File Structure

```
/src
├── services/
│   └── roomService.ts          # Room creation and management
├── pages/
│   └── MainMenuPage.tsx        # Updated with room creation
├── types/
│   └── index.ts                # TypeScript interfaces
└── lib/
    ├── firebase/
    │   └── config.ts           # Firebase configuration
    └── utils/
        └── logger.ts           # Logging utility

/firestore.rules                # Security rules
```

## Conclusion

This implementation provides:
- **Secure Room Creation**: Atomic transactions with collision detection
- **User-Friendly Room Codes**: Easy to read and share
- **Production-Ready Security**: Comprehensive rules preventing cheating and unauthorized access
- **Type Safety**: Full TypeScript support
- **Error Handling**: User-friendly error messages
- **Observability**: Detailed logging for debugging

The system is ready for the next phase: implementing real-time room synchronization and game logic.
