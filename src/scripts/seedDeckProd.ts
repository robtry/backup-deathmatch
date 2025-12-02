/**
 * Seeds the Firestore PRODUCTION database with a memory pool
 * Uses Firebase client SDK with the project credentials
 *
 * Usage: pnpm seed:deck:prod
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { generateMemoryPool } from './memoryGenerator.js';

// Firebase production configuration
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForProduction", // This will use the real key from Firebase
  authDomain: "backup-deathmatch.firebaseapp.com",
  projectId: "backup-deathmatch",
  storageBucket: "backup-deathmatch.appspot.com",
  messagingSenderId: "246277781651",
  appId: "1:246277781651:web:placeholder"
};

async function seedDeckProduction() {
  console.log('🌱 Starting PRODUCTION deck seeding process...\n');
  console.log('☁️  Connecting to Firebase Production (backup-deathmatch)...\n');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

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
    const deckRef = doc(db, 'decks', 'default');

    const deckData = {
      memories, // Just an array of strings
    };

    console.log('💾 Writing to Firestore Production...');
    await setDoc(deckRef, deckData);

    console.log('✅ Deck seeded successfully to PRODUCTION!');
    console.log(`📊 Total memories: ${memories.length}`);
    console.log(`📍 Document path: /decks/default\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding deck:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDeckProduction();
