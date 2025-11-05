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
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<JoinRoomFormData>({
    resolver: zodResolver(joinRoomSchema),
  });

  const onSubmit = async (data: JoinRoomFormData) => {
    try {
      logger.info('Attempting to join room:', data.roomId);

      // TODO: Validate that room exists in Firebase
      // For now, just navigate to the room
      navigate(`/game/${data.roomId}`);
      setOpen(false);
      reset();
    } catch (error) {
      logger.error('Error joining room:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
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
            <div className="grid gap-2">
              <Label htmlFor="roomId">Codigo de Sala</Label>
              <Input
                id="roomId"
                placeholder="Ej: abc123"
                {...register('roomId')}
                className="uppercase"
              />
              {errors.roomId && (
                <p className="text-sm text-destructive">
                  {errors.roomId.message}
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
