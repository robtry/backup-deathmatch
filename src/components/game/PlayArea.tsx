import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/8bit/button';
import { Card } from '@/components/ui/8bit/card';
import type { MemoryCard, RoomStatus, TurnState } from '@/types';

interface PlayAreaProps {
  deckSize: number;
  currentCard: MemoryCard | null;
  canClaim: boolean;
  canReject: boolean;
  onClaim: () => void;
  onReject: () => void;
  isRevealing: boolean;
  showActions: boolean;
  totalCards: number;
  revealedCards: number;
  authenticCount: number;
  corruptedCount: number;
  fatalGlitchCount: number;
  gameStatus: RoomStatus;
  tableCards: MemoryCard[];
  onCardSelect: (cardIndex: number) => void;
  canSelectCard: boolean;
  turnState: TurnState;
}

export function PlayArea({
  deckSize,
  currentCard,
  canClaim,
  canReject,
  onClaim,
  onReject,
  showActions,
  totalCards,
  revealedCards,
  authenticCount,
  corruptedCount,
  fatalGlitchCount,
  gameStatus,
  tableCards,
  onCardSelect,
  canSelectCard,
  turnState
}: PlayAreaProps) {
  // Animation variants for the deck container
  const deckContainerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1] as const, // Custom spring-like easing for snappy feel
        staggerChildren: 0.08, // Stagger for stacked card effect
        delayChildren: 0.2,
      },
    },
  } as const;

  // Animation variants for stacked cards visual effect
  // Creates illusion of multiple cards in deck
  const stackedCardVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      rotateX: -15,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.05, // Each card appears slightly after the previous
        ease: 'easeOut' as const,
      },
    }),
  };

  // Animation variants for the deck counter badge
  const counterVariants = {
    hidden: {
      scale: 0,
      rotate: -180,
    },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
        delay: 0.5, // Appears after deck is visible
      },
    },
  } as const;

  // Animation variants for the 3 visible board cards
  // These cards appear when game status changes to 'playing'
  const boardCardsContainerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Each card appears 0.15s after the previous
        delayChildren: 0.3, // Start animation after 0.3s delay
      },
    },
  } as const;

  // Individual board card animation with 3D flip effect
  // Creates a cyberpunk card reveal from the deck
  const boardCardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
      rotateY: -90, // Start rotated away (3D flip)
      y: -50, // Start above position
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0, // Flip to face forward
      y: 0, // Settle into position
      transition: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1], // Spring-like easing for snappy feel
        rotateY: {
          duration: 0.6, // Slightly longer for the flip effect
          ease: 'easeOut' as const,
        },
      },
    },
  } as const;

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Top row: Card statistics on left and right */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left: Card totals */}
        <Card className="p-2">
          <h3 className="text-xs font-bold mb-2 text-center">Cartas</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs">Total:</span>
              <span className="font-bold text-xs">{totalCards}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Reveladas:</span>
              <span className="font-bold text-xs">{revealedCards}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Restantes:</span>
              <span className="font-bold text-xs">{totalCards - revealedCards}</span>
            </div>
          </div>
        </Card>

        {/* Middle: Empty space */}
        <div />

        {/* Right: Deck composition */}
        <Card className="p-2">
          <h3 className="text-xs font-bold mb-2 text-center">Composición</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-green-500">Auténticas:</span>
              <span className="font-bold text-xs text-green-500">{authenticCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-yellow-500">Corruptas:</span>
              <span className="font-bold text-xs text-yellow-500">{corruptedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-red-500">Fatal Glitch:</span>
              <span className="font-bold text-xs text-red-500">{fatalGlitchCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Middle: Card table and deck */}
      <div className="flex-1 flex items-start justify-center gap-8 pt-8">
        {/* Left: 3 cards on table in a row - Animated when game starts */}
        <motion.div
          className="flex gap-4"
          variants={boardCardsContainerVariants}
          initial="hidden"
          animate={gameStatus === 'playing' ? 'visible' : 'hidden'}
          style={{ perspective: 1000 }} // Enable 3D transforms for card flip
        >
          {tableCards.map((card, index) => {
            const isClickable = canSelectCard && turnState === 'draw';

            return (
              <motion.div
                key={index}
                variants={boardCardVariants}
                className={`relative group ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                whileHover={isClickable ? {
                  scale: 1.05,
                  y: -10, // Lift card on hover
                  transition: { duration: 0.2 },
                } : {}}
                whileTap={isClickable ? {
                  scale: 0.95,
                  transition: { duration: 0.1 },
                } : {}}
                onClick={() => {
                  if (isClickable) {
                    onCardSelect(index);
                  }
                }}
              >
                <Card className="w-32 h-48 bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary flex items-center justify-center overflow-hidden">
                  {/* Pixel pattern background */}
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: `
                        repeating-linear-gradient(
                          0deg,
                          transparent,
                          transparent 2px,
                          rgba(255, 255, 255, 0.1) 2px,
                          rgba(255, 255, 255, 0.1) 4px
                        ),
                        repeating-linear-gradient(
                          90deg,
                          transparent,
                          transparent 2px,
                          rgba(255, 255, 255, 0.1) 2px,
                          rgba(255, 255, 255, 0.1) 4px
                        )
                      `,
                      backgroundSize: '4px 4px'
                    }}
                  />
                  {/* Question mark - Card remains hidden until selected */}
                  <div className="text-6xl opacity-50 relative z-10">?</div>

                  {/* Hover hint when clickable */}
                  {isClickable && (
                    <div className="absolute bottom-2 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs bg-primary/80 px-2 py-1 rounded">
                        SELECCIONAR
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Right: Animated Deck */}
        <motion.div
          className="relative"
          initial="hidden"
          animate="visible"
          variants={deckContainerVariants}
          style={{
            perspective: 1000,
            // Reserve space for the stacked cards offset to prevent crooked appearance
            paddingTop: '4px',
            paddingLeft: '4px',
          }}
        >
          {deckSize > 0 ? (
            <>
              {/* Render multiple stacked cards for depth effect */}
              {/* Only show top 3 cards visually for performance */}
              {[0, 1, 2].map((stackIndex) => (
                <motion.div
                  key={stackIndex}
                  custom={stackIndex}
                  variants={stackedCardVariants}
                  className="absolute"
                  style={{
                    // Fixed positioning: offset from the reserved padding space
                    top: stackIndex * 2,
                    left: stackIndex * 2,
                    zIndex: 3 - stackIndex,
                  }}
                >
                  <Card
                    className={`w-32 h-48 bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary flex items-center justify-center overflow-hidden ${
                      stackIndex > 0 ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Pixel pattern background */}
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(255, 255, 255, 0.1) 2px,
                            rgba(255, 255, 255, 0.1) 4px
                          ),
                          repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 2px,
                            rgba(255, 255, 255, 0.1) 2px,
                            rgba(255, 255, 255, 0.1) 4px
                          )
                        `,
                        backgroundSize: '4px 4px',
                      }}
                    />
                    {/* Deck label - only on top card */}
                    {stackIndex === 0 && (
                      <div className="relative z-10 text-center">
                        <div className="text-xs font-bold">MAZO</div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-32 h-48 border-2 border-dashed border-primary/30 flex items-center justify-center">
                <span className="text-xs text-muted-foreground text-center">
                  Mazo
                  <br />
                  vacío
                </span>
              </Card>
            </motion.div>
          )}
          {/* Animated Counter overlay */}
          <AnimatePresence>
            {deckSize > 0 && (
              <motion.div
                className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg z-10 border-2 border-background"
                variants={counterVariants}
                initial="hidden"
                animate="visible"
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.2 },
                }}
              >
                {deckSize}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Action buttons */}
      {showActions && currentCard && (
        <div className="flex gap-4">
          <Button
            onClick={onClaim}
            disabled={!canClaim}
            size="lg"
            variant="default"
            className="min-w-32"
          >
            RECLAMAR
          </Button>
          <Button
            onClick={onReject}
            disabled={!canReject}
            size="lg"
            variant="destructive"
            className="min-w-32"
          >
            RECHAZAR
          </Button>
        </div>
      )}

      {/* Empty deck message */}
      {deckSize === 0 && !currentCard && (
        <div className="text-center">
          <p className="text-lg font-bold text-muted-foreground">
            El mazo está vacío
          </p>
        </div>
      )}
    </div>
  );
}
