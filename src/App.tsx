import { useState } from 'react'
import { Button } from '@/components/ui/8bit/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Backup Deathmatch</h1>
          <p className="text-muted-foreground">
            8bitcn UI Library Demo - Retro Style Components
          </p>
        </div>

        <div className="border rounded-lg p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">8bit Button Demo</h2>
            <p className="text-sm text-muted-foreground">
              Click the retro-styled button to increase the counter
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 p-8 bg-muted/50 rounded-lg">
            <div className="text-6xl font-bold">{count}</div>

            <Button
              onClick={() => setCount((count) => count + 1)}
              font="retro"
              size="lg"
            >
              CLICK ME
            </Button>

            <div className="flex gap-4">
              <Button
                onClick={() => setCount(0)}
                variant="secondary"
                size="sm"
              >
                Reset
              </Button>
              <Button
                onClick={() => setCount(count - 1)}
                variant="outline"
                size="sm"
              >
                Decrease
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Variants</h3>
              <div className="flex flex-col gap-2">
                <Button variant="default" size="sm">Default</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="destructive" size="sm">Destructive</Button>
                <Button variant="outline" size="sm">Outline</Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Sizes</h3>
              <div className="flex flex-col gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
