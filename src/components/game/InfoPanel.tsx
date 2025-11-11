import { Card } from '@/components/ui/8bit/card';
import HealthBar from '@/components/ui/8bit/health-bar';
import type { PlayerInfo } from '@/types';

interface InfoPanelProps {
  currentPlayer: PlayerInfo;
  opponent: PlayerInfo;
  currentPhase: string;
  memoryHistory: string[];
  isPlayerTurn: boolean;
}

export function InfoPanel({
  currentPlayer,
  opponent,
  currentPhase,
  memoryHistory,
  isPlayerTurn
}: InfoPanelProps) {
  // Convert integrity values from range [-10, 10] to percentage [0, 100]
  const normalizeIntegrity = (value: number): number => {
    // Clamp value between -10 and 10
    const clampedValue = Math.max(-10, Math.min(10, value));
    // Convert to percentage: -10 = 0%, 0 = 50%, 10 = 100%
    return ((clampedValue + 10) / 20) * 100;
  };

  const currentPlayerPercentage = normalizeIntegrity(currentPlayer.integrity);
  const opponentPercentage = normalizeIntegrity(opponent.integrity);

  return (
    <div className="h-full p-4 flex flex-col gap-4 overflow-hidden">
      {/* Top row: Current phase */}
      <Card className="p-1.5 flex-shrink-0">
        <div className="flex items-center justify-center">
          <p className={`text-xs font-bold text-center ${isPlayerTurn ? 'text-green-500' : 'text-yellow-500'}`}>
            {currentPhase}
          </p>
        </div>
      </Card>

      {/* Second row: 3 columns - Integrities+Memories, Items (2 cols) */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left column: Integrities and Memory history stacked */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Integrities */}
          <Card className="p-2 flex-shrink-0">
            <div className="flex flex-col gap-2">
              {/* Current player integrity - green */}
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-green-500">{currentPlayer.integrity}</p>
                <div className="flex-1">
                  <HealthBar value={currentPlayerPercentage} variant="retro" progressBg="bg-green-500" />
                </div>
              </div>

              {/* Opponent integrity - red */}
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-red-500">{opponent.integrity}</p>
                <div className="flex-1">
                  <HealthBar value={opponentPercentage} variant="retro" progressBg="bg-red-500" />
                </div>
              </div>
            </div>
          </Card>

          {/* Memory history below */}
          <Card className="p-3 flex-1 flex flex-col overflow-hidden min-h-0">
            <h3 className="text-sm font-bold mb-3 flex-shrink-0">Memorias Reales</h3>
            <div
              className="space-y-2 overflow-y-scroll flex-1 min-h-0 pr-2"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'hsl(var(--primary)) hsl(var(--secondary) / 0.2)'
              }}
            >
              {memoryHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  No hay memorias reales reveladas aún
                </p>
              ) : (
                memoryHistory.map((memory, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 bg-secondary/50 rounded border border-primary/20"
                  >
                    <span className="font-bold text-green-500">{index + 1}.</span> {memory}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: Items (spanning 2 columns) */}
        <Card className="p-3 col-span-2">
          <h3 className="text-sm font-bold mb-3">Items</h3>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground italic text-center py-8">
              No hay items disponibles aún
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
