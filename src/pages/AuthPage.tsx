import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoginForm } from '@/components/ui/8bit/blocks/login-form';
import { LoadingState } from '@/components/LoadingState';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, initialized, loading } = useAuthStore();

  useEffect(() => {
    if (initialized && !loading && user) {
      if (user.currentRoom) {
        navigate(`/game/${user.currentRoom}`);
      } else {
        navigate('/menu');
      }
    }
  }, [user, initialized, loading, navigate]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Inicializando sistema..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Backup Deathmatch</h1>
          <p className="text-sm text-muted-foreground">
            Reivindica tus memorias para demostrar que eres el original
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
