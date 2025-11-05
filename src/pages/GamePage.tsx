import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/8bit/button';
import { toast } from '@/components/ui/8bit/toast';
import { logger } from '@/lib/utils/logger';
import { useAuthStore } from '@/stores/authStore';
import { leaveRoom } from '@/services/roomService';

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isCopied, setIsCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleCopyRoomCode = async () => {
    if (!roomId) {
      logger.warn('Attempted to copy room code but roomId is undefined', undefined, 'GamePage');
      return;
    }

    try {
      // Check if Clipboard API is available
      if (!navigator.clipboard) {
        logger.error('Clipboard API not available', undefined, 'GamePage');
        toast('No se puede copiar en este navegador');
        return;
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(roomId);

      logger.info('Room code copied to clipboard', { roomId }, 'GamePage');

      // Show success feedback
      setIsCopied(true);
      toast('¡Código copiado!');

      // Reset button state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      logger.error('Failed to copy room code', error, 'GamePage');
      toast('Error al copiar el código');
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !user) {
      logger.warn('Cannot leave room: missing roomId or user', { roomId, userId: user?.id }, 'GamePage');
      return;
    }

    setIsLeaving(true);

    try {
      logger.info('Leaving room', { roomId, userId: user.id }, 'GamePage');
      await leaveRoom(user.id, roomId);

      toast('Has abandonado la sala');
      logger.info('Successfully left room, navigating to menu', { roomId }, 'GamePage');

      navigate('/menu');
    } catch (error) {
      logger.error('Failed to leave room', error, 'GamePage');
      toast('Error al abandonar la sala');
      setIsLeaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeaveRoom}
            disabled={isLeaving}
          >
            {isLeaving ? 'Abandonando...' : 'Abandonar Sala'}
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Sala de Juego</h1>
            <div className="space-y-3">
              <p className="text-2xl font-bold text-foreground">{roomId}</p>
              <p className="text-sm text-muted-foreground">Comparte este código con tu oponente</p>
              <Button
                variant="default"
                size="lg"
                onClick={handleCopyRoomCode}
                disabled={isCopied}
                className="w-full max-w-xs"
              >
                {isCopied ? '¡Copiado!' : 'Copiar Código'}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-8 text-center w-full max-w-2xl mt-8">
            <p className="text-muted-foreground">Esperando al segundo jugador...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
