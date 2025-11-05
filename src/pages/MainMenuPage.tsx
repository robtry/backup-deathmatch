import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import MainMenu from '@/components/ui/8bit/blocks/main-menu';
import { logger } from '@/lib/utils/logger';

export default function MainMenuPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(7);
    navigate(`/game/${roomId}`);
  };

  const handleJoinRoom = () => {
    logger.info('Unirse a sala - proximamente');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      logger.error('Error al cerrar sesión', error);
    }
  };

  const menuItems = [
    {
      label: 'CREAR SALA',
      action: handleCreateRoom,
    },
    {
      label: 'UNIRSE A SALA',
      action: handleJoinRoom,
      variant: 'outline' as const,
    },
    {
      label: 'SALIR',
      action: handleLogout,
      variant: 'secondary' as const,
    },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Backup Deathmatch</h1>
          <p className="text-sm text-muted-foreground">
            Reivindica tus memorias para demostrar que eres el original
          </p>
        </div>

        <MainMenu
          title="Menú Principal"
          description="Elige tu acción"
          menuItems={menuItems}
        />
      </div>
    </div>
  )
}
