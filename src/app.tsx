import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/app-layout'
import { RequireAuth } from '@/components/require-auth'
import { AuthProvider } from '@/lib/auth-context'
import { CreateRoom } from './pages/create-room'
import { Login } from './pages/login'
import { RecordRoomAudio } from './pages/record-room-audio'
import { Room } from './pages/room'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Login />} path="/login" />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route element={<CreateRoom />} index />
                <Route element={<Room />} path="room/:roomId" />
                <Route
                  element={<RecordRoomAudio />}
                  path="room/:roomId/audio"
                />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
