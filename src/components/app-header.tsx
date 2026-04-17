import { LogOut, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

export function AppHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="border-border/40 border-b bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link className="flex items-baseline gap-2" to="/">
          <span className="font-semibold text-foreground text-lg tracking-tight">
            EasyClass
            <span className="text-primary">.ai</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-muted-foreground text-sm sm:flex">
            <User className="size-4 shrink-0" />
            <span className="max-w-[200px] truncate font-medium text-foreground">
              {user?.name}
            </span>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              logout()
              window.location.assign('/login')
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}
