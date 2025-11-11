import { InfoPanel } from './InfoPanel';
import { PlayArea } from './PlayArea';
import type { PlayerInfo, FirestoreRoom, MemoryCard } from '@/types';

interface GameBoardProps {
  room: FirestoreRoom;
  currentPlayer: PlayerInfo;
  opponent: PlayerInfo;
  userId: string;
  onClaim: () => void;
  onReject: () => void;
  onCardSelect: (cardIndex: number) => void;
}

export function GameBoard({
  room,
  currentPlayer,
  opponent,
  userId,
  onClaim,
  onReject,
  onCardSelect
}: GameBoardProps) {
  // Calculate game statistics
  const totalCards = 15; // Total cards in the game
  const revealedCards = totalCards - room.memory_deck.length - (room.current_card ? 1 : 0);

  // Count authentic cards in deck
  const authenticCount = room.memory_deck.filter(card => card.authenticity === 'authentic').length;
  const corruptedCount = room.memory_deck.filter(card => card.authenticity === 'corrupted').length;
  const fatalGlitchCount = room.memory_deck.filter(card => card.authenticity === 'fatalGlitch').length;

  // Get memory history (authentic cards only - these are the "real" memories)
  const memoryHistory: string[] = room.revealed_real_memories || [];

  // Determine current turn and phase
  const currentTurnPlayerId = room.order_players[room.turn % room.order_players.length];
  const isPlayerTurn = currentTurnPlayerId === userId;

  // Determine phase based on game state
  let currentPhase = '';
  if (room.current_card) {
    if (isPlayerTurn) {
      currentPhase = 'Tu turno: Debes decidir';
    } else {
      currentPhase = `Turno de ${opponent.name}`;
    }
  } else {
    if (isPlayerTurn) {
      currentPhase = 'Tu turno: Revela una carta';
    } else {
      currentPhase = `Turno de ${opponent.name}`;
    }
  }

  // Determine if player can perform actions
  const canClaim = isPlayerTurn && room.current_card !== null;
  const canReject = isPlayerTurn && room.current_card !== null;
  const showActions = isPlayerTurn && room.current_card !== null;

  // Determine if player can select a card from the table
  const canSelectCard = isPlayerTurn && room.turn_state === 'draw';

  // Calculate remaining cards in deck (not yet drawn to table)
  const remainingDeckSize = room.memory_deck.length - room.cards_drawn;

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Top half: Play area with deck and revealed card */}
      <div className="h-1/2 bg-background border-b-4 border-primary">
        <PlayArea
          deckSize={remainingDeckSize}
          currentCard={room.current_card}
          canClaim={canClaim}
          canReject={canReject}
          onClaim={onClaim}
          onReject={onReject}
          isRevealing={false}
          showActions={showActions}
          totalCards={totalCards}
          revealedCards={revealedCards}
          authenticCount={authenticCount}
          corruptedCount={corruptedCount}
          fatalGlitchCount={fatalGlitchCount}
          gameStatus={room.status}
          tableCards={room.table_cards}
          onCardSelect={onCardSelect}
          canSelectCard={canSelectCard}
          turnState={room.turn_state}
        />
      </div>

      {/* Bottom half: Info panel with stats and history */}
      <div className="h-1/2 bg-secondary/20">
        <InfoPanel
          currentPlayer={currentPlayer}
          opponent={opponent}
          currentPhase={currentPhase}
          memoryHistory={memoryHistory}
          isPlayerTurn={isPlayerTurn}
        />
      </div>
    </div>
  );
}
