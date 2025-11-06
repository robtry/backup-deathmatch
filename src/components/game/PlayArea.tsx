import { Button } from '@/components/ui/8bit/button';
import { Card } from '@/components/ui/8bit/card';
import type { MemoryCard } from '@/types';

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
}

export function PlayArea({
  deckSize,
  currentCard,
  canClaim,
  canReject,
  onClaim,
  onReject,
  isRevealing,
  showActions,
  totalCards,
  revealedCards,
  authenticCount,
  corruptedCount,
  fatalGlitchCount
}: PlayAreaProps) {
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
      <div className="flex-1 flex items-center justify-center gap-8">
        {/* Left: 3 cards on table in a row */}
        <div className="flex gap-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="relative group cursor-pointer hover:scale-105 transition-transform">
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
                {/* Question mark */}
                <div className="text-6xl opacity-50 relative z-10">?</div>
              </Card>
            </div>
          ))}
        </div>

        {/* Right: Deck */}
        <div className="relative">
          {deckSize > 0 ? (
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
              {/* Deck label */}
              <div className="relative z-10 text-center">
                <div className="text-xs font-bold">MAZO</div>
              </div>
            </Card>
          ) : (
            <Card className="w-32 h-48 border-2 border-dashed border-primary/30 flex items-center justify-center">
              <span className="text-xs text-muted-foreground text-center">
                Mazo<br />vacío
              </span>
            </Card>
          )}
          {/* Counter overlay */}
          {deckSize > 0 && (
            <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg z-10 border-2 border-background">
              {deckSize}
            </div>
          )}
        </div>
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
