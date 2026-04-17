import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import type { CreateRoomRequest } from './types/create-room-request'
import type { CreateRoomResponse } from './types/create-room-response'

export function useCreateRoom() {
  const queryClient = useQueryClient()
  const { apiFetch } = useAuth()

  return useMutation({
    mutationFn: async (data: CreateRoomRequest) => {
      const response = await apiFetch('/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = (await response.json()) as { error?: string }
        throw new Error(err.error ?? 'Erro ao criar sala')
      }

      const result: CreateRoomResponse = await response.json()

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get-rooms'] })
    },
  })
}
