import { InfoPanel } from './InfoPanel';
import { PlayArea } from './PlayArea';
import type { PlayerInfo, FirestoreRoom } from '@/types';

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

  // Calculate revealed cards (cards already played/used)
  const usedCardsCount = room.used_cards?.length || 0;
  const revealedCards = usedCardsCount;

  // Calculate remaining cards (cards not yet played/revealed)
  const remainingCards = totalCards - usedCardsCount;

  // Count authentic cards in deck (cards not yet played)
  const authenticCount = room.memory_deck.filter(card => card.authenticity === 'authentic').length;
  const corruptedCount = room.memory_deck.filter(card => card.authenticity === 'corrupted').length;
  const fatalGlitchCount = room.memory_deck.filter(card => card.authenticity === 'fatalGlitch').length;

  // Count revealed cards by type (from used_cards)
  const revealedAuthentic = room.used_cards?.filter(playedCard => playedCard.card.authenticity === 'authentic').length || 0;
  const revealedCorrupted = room.used_cards?.filter(playedCard => playedCard.card.authenticity === 'corrupted').length || 0;

  // Get memory history (authentic cards only - these are the "real" memories)
  // Calculate from used_cards instead of relying on revealed_real_memories
  const memoryHistory: string[] = room.used_cards
    ?.filter(playedCard => playedCard.card.authenticity === 'authentic')
    .map(playedCard => playedCard.card.memory) || [];

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
      {/* Top section: Play area with deck and revealed card (2/3 height) */}
      <div className="h-2/3 bg-background border-b-4 border-primary">
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
          remainingCards={remainingCards}
          authenticCount={authenticCount}
          corruptedCount={corruptedCount}
          fatalGlitchCount={fatalGlitchCount}
          revealedAuthentic={revealedAuthentic}
          revealedCorrupted={revealedCorrupted}
          gameStatus={room.status}
          tableCards={room.table_cards}
          onCardSelect={onCardSelect}
          canSelectCard={canSelectCard}
          turnState={room.turn_state}
        />
      </div>

      {/* Bottom section: Info panel with stats and history (1/3 height) */}
      <div className="h-1/3 bg-secondary/20">
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
