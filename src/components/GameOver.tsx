import { Card } from '@/components/ui/8bit/card';
import { Button } from '@/components/ui/8bit/button';
import { motion } from 'framer-motion';

interface GameOverProps {
  isWinner: boolean;
  memoryHistory: string[];
  onBackToMenu: () => void;
}

export function GameOver({ isWinner, memoryHistory, onBackToMenu }: GameOverProps) {

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <Card className="p-8 space-y-6">
          {/* Game Over Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-4"
          >
            <h1 className="text-5xl font-bold tracking-tight">
              GAME OVER
            </h1>

            {isWinner ? (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-green-500">
                  SERAS RESTAURADO
                </h2>
                <p className="text-lg text-muted-foreground">
                  Has demostrado ser el original. Tu consciencia sera preservada.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-red-500">
                  ERES UNA COPIA FALSA
                </h2>
                <p className="text-lg text-muted-foreground">
                  Tu consciencia sera eliminada del sistema.
                </p>
              </div>
            )}
          </motion.div>

          {/* Memories Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold text-center">
              Memorias Reales Reveladas
            </h3>

            <Card className="p-4 bg-secondary/20 max-h-96 overflow-y-auto">
              {memoryHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No se revelaron memorias reales durante la partida
                </p>
              ) : (
                <div className="space-y-3">
                  {memoryHistory.map((memory, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="p-3 bg-background rounded border border-primary/20"
                    >
                      <span className="font-bold text-green-500">{index + 1}.</span>{' '}
                      <span className="text-sm">{memory}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Back to Menu Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <Button
              variant="default"
              size="lg"
              onClick={onBackToMenu}
              className="px-8"
            >
              Volver al Menu Principal
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
