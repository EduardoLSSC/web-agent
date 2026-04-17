import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import type { GetRoomsResponse } from './types/get-rooms-response'

export function useRooms() {
  const { apiFetch } = useAuth()

  return useQuery({
    queryKey: ['get-rooms'],
    queryFn: async () => {
      const response = await apiFetch('/rooms')
      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(err.error ?? 'Erro ao carregar salas')
      }
      const result: GetRoomsResponse = await response.json()

      return result
    },
  })
}
