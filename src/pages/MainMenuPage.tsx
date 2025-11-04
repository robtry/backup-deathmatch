import { useNavigate } from 'react-router-dom'
import MainMenu from '@/components/ui/8bit/blocks/main-menu'

export default function MainMenuPage() {
  const navigate = useNavigate()

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(7)
    navigate(`/game/${roomId}`)
  }

  const handleJoinRoom = () => {
    console.log('Unirse a sala - proximamente')
  }

  const handleLogout = () => {
    navigate('/')
  }

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
