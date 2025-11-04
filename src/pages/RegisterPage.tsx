import { RegisterForm } from '@/components/ui/8bit/blocks/register-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Backup Deathmatch</h1>
          <p className="text-sm text-muted-foreground">
            Reivindica tus memorias para demostrar que eres el original
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
