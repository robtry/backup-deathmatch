import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/8bit/button'

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sala de Juego</h1>
            <p className="text-sm text-muted-foreground">ID de Sala: {roomId}</p>
          </div>
          <Button variant="outline" size="sm">
            Abandonar Sala
          </Button>
        </div>

        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Interfaz del juego próximamente...</p>
        </div>
      </div>
    </div>
  )
}
