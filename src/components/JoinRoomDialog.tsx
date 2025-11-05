import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/8bit/dialog';
import { Button } from '@/components/ui/8bit/button';
import { Input } from '@/components/ui/8bit/input';
import { Label } from '@/components/ui/8bit/label';
import { logger } from '@/lib/utils/logger';
import { useAuthStore } from '@/stores/authStore';
import { joinRoom } from '@/services/roomService';

const joinRoomSchema = z.object({
  roomId: z
    .string()
    .min(6, 'El codigo de sala debe tener al menos 6 caracteres')
    .max(20, 'El codigo de sala no puede tener mas de 20 caracteres')
    .regex(/^[a-zA-Z0-9-_]+$/, 'El codigo solo puede contener letras, numeros, guiones y guiones bajos'),
});

type JoinRoomFormData = z.infer<typeof joinRoomSchema>;

interface JoinRoomDialogProps {
  children: React.ReactNode;
}

export function JoinRoomDialog({ children }: JoinRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
    reset,
  } = useForm<JoinRoomFormData>({
    resolver: zodResolver(joinRoomSchema),
  });

  const onSubmit = async (data: JoinRoomFormData) => {
    if (!user) {
      setError('Por favor inicia sesión nuevamente');
      return;
    }

    setError(null);

    try {
      logger.info('Attempting to join room', { roomId: data.roomId, userId: user.id });

      // Join room using service (validates room exists, not full, etc.)
      await joinRoom(user.id, data.roomId.toUpperCase());

      logger.info('Successfully joined room', { roomId: data.roomId });

      // Navigate to game room
      navigate(`/game/${data.roomId.toUpperCase()}`);
      setOpen(false);
      reset();
    } catch (error: any) {
      logger.error('Error joining room', { error, roomId: data.roomId });
      setError(error.message || 'Error al unirse a la sala');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unirse a Sala</DialogTitle>
          <DialogDescription>
            Ingresa el codigo de la sala a la que deseas unirte
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="roomId">Codigo de Sala</Label>
              <Input
                id="roomId"
                placeholder="Ej: abc123"
                {...register('roomId')}
                className="uppercase"
              />
              {formErrors.roomId && (
                <p className="text-sm text-destructive">
                  {formErrors.roomId.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Uniendose...' : 'Unirse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
