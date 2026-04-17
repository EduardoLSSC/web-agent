import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/app-header'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <AppHeader />
      <Outlet />
    </div>
  )
}
