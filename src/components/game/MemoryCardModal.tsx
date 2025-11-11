import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/8bit/dialog';
import { Button } from '@/components/ui/8bit/button';
import { Card } from '@/components/ui/8bit/card';
import type { MemoryCard, TurnState } from '@/types';

interface MemoryCardModalProps {
  isOpen: boolean;
  card: MemoryCard | null;
  turnState: TurnState;
  currentMultiplier: number;
  isPlayerTurn: boolean;
  cardInitiator: string | null;
  currentUserId: string;
  onClaim: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function MemoryCardModal({
  isOpen,
  card,
  turnState,
  currentMultiplier,
  isPlayerTurn,
  cardInitiator,
  currentUserId,
  onClaim,
  onReject,
  isProcessing = false
}: MemoryCardModalProps) {
  if (!card) return null;

  // Determine if the player can see the card AUTHENTICITY and VALUE
  // Player can see authenticity/value if:
  // 1. They are in 'decide' state AND they are the initiator (they selected the card)
  // 2. They are in 'opponent_decide' state AND they were the initiator (they see full card they rejected)
  const canSeeCardDetails = (turnState === 'decide' && cardInitiator === currentUserId) ||
                            (turnState === 'opponent_decide' && cardInitiator === currentUserId);

  // Everyone can see the MEMORY TEXT (the story)
  const canSeeMemoryText = true;

  // Determine card color based on authenticity
  const getCardColor = (authenticity: string) => {
    switch (authenticity) {
      case 'authentic':
        return 'border-green-500 bg-green-500/10';
      case 'corrupted':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'fatalGlitch':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-primary bg-primary/10';
    }
  };

  // Determine value display color
  const getValueColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-foreground';
  };

  // Determine modal title based on state
  const getModalTitle = () => {
    if (turnState === 'decide') {
      if (cardInitiator === currentUserId) {
        return 'Carta revelada';
      }
      return 'El oponente está decidiendo';
    }
    if (turnState === 'opponent_decide') {
      if (cardInitiator === currentUserId) {
        return 'Tu oponente debe decidir';
      }
      return 'Carta rechazada';
    }
    return 'Carta seleccionada';
  };

  // Determine description based on state
  const getModalDescription = () => {
    if (turnState === 'decide') {
      if (cardInitiator === currentUserId) {
        return 'Decide si reclamar esta memoria o rechazarla';
      }
      return 'Esperando la decisión del oponente...';
    }
    if (turnState === 'opponent_decide') {
      if (cardInitiator === currentUserId) {
        return `Esperando decisión del oponente (Multiplicador: ${currentMultiplier}x)`;
      }
      return `Tu oponente rechazó esta carta. Decides a ciegas (Multiplicador: ${currentMultiplier}x)`;
    }
    return '';
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Card Display */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <Card className={`w-64 h-80 p-6 flex flex-col justify-between ${canSeeCardDetails ? getCardColor(card.authenticity) : 'border-primary bg-primary/10'} border-4`}>
              {/* Card Header - Only show authenticity if player can see details */}
              {canSeeCardDetails && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-center uppercase tracking-wider">
                    {card.authenticity === 'authentic' && 'Auténtica'}
                    {card.authenticity === 'corrupted' && 'Corrupta'}
                    {card.authenticity === 'fatalGlitch' && 'Fatal Glitch'}
                  </div>
                  <div className="h-px bg-foreground/20" />
                </div>
              )}

              {/* Card Content - Memory Text (ALWAYS visible) */}
              <div className="flex-1 flex items-center justify-center px-2">
                <p className="text-sm text-center leading-relaxed">
                  {card.memory}
                </p>
              </div>

              {/* Card Footer - Value (only if can see details) */}
              {canSeeCardDetails && (
                <div className="space-y-2">
                  <div className="h-px bg-foreground/20" />
                  <div className={`text-4xl font-bold text-center ${getValueColor(card.value)}`}>
                    {card.value > 0 ? `+${card.value}` : card.value}
                  </div>
                </div>
              )}

              {/* Show mystery indicator when opponent can't see details */}
              {!canSeeCardDetails && (
                <div className="space-y-2">
                  <div className="h-px bg-foreground/20" />
                  <div className="text-4xl font-bold text-center opacity-30">
                    ?
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Multiplier Display */}
          {currentMultiplier > 1 && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-block px-4 py-2 bg-yellow-500/20 border-2 border-yellow-500 rounded">
                <span className="text-sm font-bold text-yellow-500">
                  Multiplicador: {currentMultiplier}x
                </span>
              </div>
            </motion.div>
          )}

          {/* Action Buttons - Show based on who needs to decide */}
          {((turnState === 'decide' && cardInitiator === currentUserId) ||
            (turnState === 'opponent_decide' && cardInitiator !== currentUserId)) && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              <Button
                onClick={onClaim}
                disabled={isProcessing}
                size="lg"
                variant="default"
                className="flex-1"
              >
                {isProcessing ? 'Procesando...' : 'RECLAMAR'}
              </Button>
              <Button
                onClick={onReject}
                disabled={isProcessing}
                size="lg"
                variant="destructive"
                className="flex-1"
              >
                {isProcessing ? 'Procesando...' : 'RECHAZAR'}
              </Button>
            </motion.div>
          )}

          {/* Waiting message when waiting for someone else's decision */}
          {((turnState === 'decide' && cardInitiator !== currentUserId) ||
            (turnState === 'opponent_decide' && cardInitiator === currentUserId)) && (
            <div className="text-center text-sm text-muted-foreground">
              Esperando decisión del oponente...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
