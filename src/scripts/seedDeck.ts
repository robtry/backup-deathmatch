/**
 * Seeds the Firestore database with a memory pool
 *
 * Usage:
 *   Local (emulator):  FIRESTORE_EMULATOR_HOST=localhost:8080 pnpm seed:deck
 *   Production:        FIREBASE_PROJECT_ID=your-project-id pnpm seed:deck
 *
 * For production, you need to:
 * 1. Set FIREBASE_PROJECT_ID environment variable
 * 2. Authenticate with Firebase CLI: firebase login
 * 3. Or provide service account credentials via GOOGLE_APPLICATION_CREDENTIALS
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { generateMemoryPool } from './memoryGenerator.js';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'backup-deathmatch';

    initializeApp({
      projectId,
    });
  }

  const db = getFirestore();

  // Connect to emulator ONLY if FIRESTORE_EMULATOR_HOST is set
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    console.log(`🔧 Connecting to Firestore Emulator at ${emulatorHost}...`);

    const [host, port] = emulatorHost.split(':');
    db.settings({
      host: `${host}:${port}`,
      ssl: false,
    });
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'backup-deathmatch';
    console.log(`☁️  Connecting to Firebase Production (${projectId})...`);
    console.log('⚠️  Make sure you are authenticated with Firebase CLI or have GOOGLE_APPLICATION_CREDENTIALS set\n');
  }

  return db;
}

async function seedDeck() {
  console.log('🌱 Starting deck seeding process...\n');

  const db = initializeFirebaseAdmin();

  try {
    // Generate 500 unique random memories (just strings)
    console.log('🎲 Generating 500 unique procedural memories...');
    const memories = generateMemoryPool(500);

    console.log('✅ Generated memories successfully!\n');
    console.log('📦 Sample memories (first 10):');
    memories.slice(0, 10).forEach((mem, i) => {
      console.log(`   ${i + 1}. ${mem}`);
    });
    console.log('   ...\n');

    // Create the deck document with just an array of strings
    const deckRef = db.collection('decks').doc('default');

    const deckData = {
      memories, // Just an array of strings
    };

    console.log('💾 Writing to Firestore...');
    await deckRef.set(deckData);

    console.log('✅ Deck seeded successfully!');
    console.log(`📊 Total memories: ${memories.length}`);
    console.log(`📍 Document path: /decks/default\n`);

    console.log('🎮 Next steps:');
    console.log('   1. When creating a room, fetch this deck from /decks/default');
    console.log('   2. Randomly assign values (-3 to +3) to each memory');
    console.log('   3. Assign composition based on value:');
    console.log('      - Positive values (+1 to +3) = authentic');
    console.log('      - Negative values (-1 to -3) = corrupted');
    console.log('      - Zero (0) = fatal_glitch');
    console.log('   4. Shuffle and select 8 cards for the game\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding deck:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDeck();
