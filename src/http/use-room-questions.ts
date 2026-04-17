import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import type { GetRoomQuestionsResponse } from './types/get-room-questions-response'

export function useRoomQuestions(roomId: string) {
  const { apiFetch } = useAuth()

  return useQuery({
    queryKey: ['get-questions', roomId],
    queryFn: async () => {
      const response = await apiFetch(`/rooms/${roomId}/questions`)
      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(err.error ?? 'Erro ao carregar perguntas')
      }
      const result: GetRoomQuestionsResponse = await response.json()

      return result
    },
  })
}
