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
  return (
    <div className="h-full p-4 flex flex-col gap-4">
      {/* Top row: Current phase */}
      <Card className="p-1.5">
        <div className="flex items-center justify-center">
          <p className={`text-xs font-bold text-center ${isPlayerTurn ? 'text-green-500' : 'text-yellow-500'}`}>
            {currentPhase}
          </p>
        </div>
      </Card>

      {/* Second row: 3 columns - Integrities+Memories, Items (2 cols) */}
      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Left column: Integrities and Memory history stacked */}
        <div className="flex flex-col gap-4">
          {/* Integrities */}
          <Card className="p-2">
            <div className="flex flex-col gap-2">
              {/* Current player integrity - green */}
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-green-500">{currentPlayer.integrity}</p>
                <div className="flex-1">
                  <HealthBar value={currentPlayer.integrity} max={10} variant="retro" />
                </div>
              </div>

              {/* Opponent integrity - red */}
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-red-500">{opponent.integrity}</p>
                <div className="flex-1">
                  <HealthBar value={opponent.integrity} max={10} variant="retro" />
                </div>
              </div>
            </div>
          </Card>

          {/* Memory history below */}
          <Card className="p-3 flex-1">
            <h3 className="text-sm font-bold mb-3">Memorias Reales</h3>
            <div className="space-y-2 max-h-[calc(100%-2rem)] overflow-y-auto">
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
