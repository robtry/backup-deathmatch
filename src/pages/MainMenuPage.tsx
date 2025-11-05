import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import MainMenu from '@/components/ui/8bit/blocks/main-menu';
import { JoinRoomDialog } from '@/components/JoinRoomDialog';
import { Button } from '@/components/ui/8bit/button';
import { logger } from '@/lib/utils/logger';
import { createRoom } from '@/services/roomService';

export default function MainMenuPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to active room if user has one
  useEffect(() => {
    if (user?.currentRoom) {
      logger.info('User has active room, redirecting', { roomCode: user.currentRoom });
      navigate(`/game/${user.currentRoom}`);
    }
  }, [user, navigate]);

  const handleCreateRoom = async () => {
    if (!user) {
      logger.error('No user found when creating room');
      setError('Por favor inicia sesión nuevamente');
      return;
    }

    setIsCreatingRoom(true);
    setError(null);

    try {
      logger.info('Creating new room', { userId: user.id });
      const roomCode = await createRoom(user.id);
      logger.info('Room created successfully, navigating', { roomCode });
      navigate(`/game/${roomCode}`);
    } catch (error: any) {
      logger.error('Error creating room', error);
      setError(error.message || 'Error al crear la sala');
      setIsCreatingRoom(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      logger.error('Error al cerrar sesión', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Backup Deathmatch</h1>
          <p className="text-sm text-muted-foreground">
            Reivindica tus memorias para demostrar que eres el original
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">Menú Principal</h2>
          <p className="text-sm text-muted-foreground text-center">Elige tu acción</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleCreateRoom}
              className="w-full"
              disabled={isCreatingRoom}
            >
              {isCreatingRoom ? 'CREANDO SALA...' : 'CREAR SALA'}
            </Button>

            <JoinRoomDialog>
              <Button variant="outline" className="w-full" disabled={isCreatingRoom}>
                UNIRSE A SALA
              </Button>
            </JoinRoomDialog>

            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-full"
              disabled={isCreatingRoom}
            >
              SALIR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
