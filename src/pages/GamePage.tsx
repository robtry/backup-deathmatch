import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/8bit/button';
import { toast } from '@/components/ui/8bit/toast';
import { logger } from '@/lib/utils/logger';
import { useAuthStore } from '@/stores/authStore';
import { leaveRoom, startGame } from '@/services/roomService';
import type { FirestoreRoom } from '@/types';

interface PlayerInfo {
  id: string;
  name: string;
  integrity: number;
}

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isCopied, setIsCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [room, setRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const isLeavingRef = useRef(false);

  // Real-time listener for room updates
  useEffect(() => {
    if (!roomId) {
      logger.error('Room ID is missing', undefined, 'GamePage');
      navigate('/menu');
      return;
    }

    logger.info('Setting up real-time room listener', { roomId }, 'GamePage');

    const roomRef = doc(db, 'rooms', roomId);

    // Subscribe to room changes
    const unsubscribe = onSnapshot(
      roomRef,
      async (snapshot) => {
        // Don't process updates if user is leaving
        if (isLeavingRef.current) {
          logger.debug('Ignoring room update while leaving', { roomId }, 'GamePage');
          return;
        }

        if (!snapshot.exists()) {
          // Only show error and redirect if the room has been loaded before
          // This prevents race condition on first load with Firebase emulator
          if (hasLoadedOnce) {
            logger.warn('Room no longer exists', { roomId }, 'GamePage');
            toast('La sala ya no existe');
            navigate('/menu');
          } else {
            logger.debug('Room not found on first load, waiting...', { roomId }, 'GamePage');
          }
          return;
        }

        // Mark that we've successfully loaded the room at least once
        if (!hasLoadedOnce) {
          setHasLoadedOnce(true);
        }

        const roomData = snapshot.data() as FirestoreRoom;
        logger.debug('Room data updated', { roomId, status: roomData.status, playerCount: Object.keys(roomData.players).length }, 'GamePage');

        setRoom(roomData);

        // Fetch player names from users collection
        try {
          const playerInfoPromises = roomData.order_players.map(async (playerId) => {
            const userRef = doc(db, 'users', playerId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              return {
                id: playerId,
                name: userData.name || 'Jugador',
                integrity: roomData.players[playerId]?.integrity || 0
              };
            }

            return {
              id: playerId,
              name: 'Jugador',
              integrity: roomData.players[playerId]?.integrity || 0
            };
          });

          const playerInfos = await Promise.all(playerInfoPromises);
          setPlayers(playerInfos);
          logger.debug('Player info loaded', { playerCount: playerInfos.length }, 'GamePage');
        } catch (error) {
          logger.error('Failed to fetch player names', error, 'GamePage');
        }

        setIsLoadingRoom(false);
      },
      (error) => {
        logger.error('Room listener error', error, 'GamePage');
        toast('Error al conectar con la sala');
        setIsLoadingRoom(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      logger.debug('Cleaning up room listener', { roomId }, 'GamePage');
      unsubscribe();
    };
  }, [roomId, navigate]);

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
    isLeavingRef.current = true;

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
      isLeavingRef.current = false;
    }
  };

  const handleStartGame = async () => {
    if (!roomId || !user) {
      logger.warn('Cannot start game: missing roomId or user', { roomId, userId: user?.id }, 'GamePage');
      return;
    }

    setIsStarting(true);

    try {
      logger.info('Starting game', { roomId, userId: user.id }, 'GamePage');
      await startGame(user.id, roomId);

      toast('¡Partida iniciada!');
      logger.info('Game started successfully', { roomId }, 'GamePage');
    } catch (error: any) {
      logger.error('Failed to start game', error, 'GamePage');
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar la partida';
      toast(errorMessage);
    } finally {
      setIsStarting(false);
    }
  };

  // Check if current user is the creator (first player)
  const isCreator = user && room && room.order_players[0] === user.id;

  // Check if we can start the game (2 players, waiting status, user is creator)
  const canStartGame = isCreator && room?.status === 'waiting' && players.length === 2;

  if (isLoadingRoom) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando sala...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Only show abandon button when room is in waiting status */}
        {room?.status === 'waiting' && (
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
        )}

        <div className="flex flex-col items-center justify-center space-y-6 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Sala de Juego</h1>
            {/* Only show room code and copy button to the creator */}
            {isCreator && (
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
            )}
          </div>

          {/* Players section */}
          <div className="border rounded-lg p-8 w-full max-w-2xl mt-8">
            <h2 className="text-xl font-bold mb-4 text-center">Jugadores</h2>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">
                      {index + 1}.
                    </span>
                    <span className="font-medium">
                      {player.name}
                      {player.id === user?.id && ' (Tú)'}
                      {index === 0 && (
                        <span className="ml-2 text-xs px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded">
                          Creador
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    Integridad: {player.integrity}
                  </span>
                </div>
              ))}

              {/* Show waiting message if only 1 player */}
              {players.length === 1 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Esperando al segundo jugador...</p>
                </div>
              )}
            </div>

            {/* Start game button - only show for creator with 2 players */}
            {canStartGame && (
              <div className="mt-6">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleStartGame}
                  disabled={isStarting}
                  className="w-full"
                >
                  {isStarting ? 'Iniciando...' : 'INICIAR PARTIDA'}
                </Button>
              </div>
            )}

            {/* Status messages */}
            {room?.status === 'intro' && (
              <div className="mt-6 text-center">
                <p className="text-lg font-medium text-green-500">
                  ¡Introducción en progreso!
                </p>
              </div>
            )}

            {room?.status === 'playing' && (
              <div className="mt-6 text-center">
                <p className="text-lg font-medium text-green-500">
                  ¡Partida en curso!
                </p>
              </div>
            )}

            {room?.status === 'finished' && (
              <div className="mt-6 text-center">
                <p className="text-lg font-medium text-red-500">
                  Partida finalizada
                </p>
              </div>
            )}

            {/* Show message if not creator and waiting for 2nd player */}
            {!isCreator && players.length === 2 && room?.status === 'waiting' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Esperando a que el creador inicie la partida...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
