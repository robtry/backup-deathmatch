# Backup Deathmatch

A retro 8-bit style memory deathmatch game built with React, TypeScript, and Firebase.

## Tech Stack

- React + TypeScript + Vite
- 8bitcn UI Library (retro-styled components)
- Tailwind CSS
- Framer Motion (animations)
- Firebase (auth, database, local emulators)

## Development

```bash
# Install dependencies
pnpm install

# Run Firebase emulators
firebase emulators:start

# Populate local emulators with seed data
FIRESTORE_EMULATOR_HOST=localhost:8080 pnpm seed:deck

# Run dev server
pnpm dev

```
