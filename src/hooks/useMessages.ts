import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_MESSAGES } from '@/lib/mock-data'
import type { Message } from '@/types/database'

function conversationKey(id1: string, id2: string) {
  return [id1, id2].sort().join('-')
}

/** Single conversation between two users, with Realtime subscription */
export function useMessages(
  userId: string | null | undefined,
  otherId: string | null | undefined
) {
  const queryClient = useQueryClient()
  const key = userId && otherId ? conversationKey(userId, otherId) : null

  const query = useQuery({
    queryKey: ['messages', key],
    enabled: !!(userId && otherId),
    queryFn: async (): Promise<Message[]> => {
      if (!IS_SUPABASE || !userId || !otherId) {
        return MOCK_MESSAGES.filter(
          m => (m.sender_id === userId && m.receiver_id === otherId) ||
               (m.sender_id === otherId && m.receiver_id === userId)
        ) as Message[]
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, name, email, role, team_id, avatar_url, created_at),
          receiver:profiles!receiver_id(id, name, email, role, team_id, avatar_url, created_at)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)
      return (data ?? []) as Message[]
    },
  })

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!IS_SUPABASE || !userId || !otherId || !key) return

    const channel = supabase
      .channel(`messages-${key}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', key] })
          queryClient.invalidateQueries({ queryKey: ['allConversations', userId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, otherId, key, queryClient])

  return query
}

/** All messages involving this user — used for sidebar and badge count */
export function useAllConversations(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['allConversations', userId],
    enabled: !!userId,
    placeholderData: IS_SUPABASE ? undefined : MOCK_MESSAGES as Message[],
    queryFn: async (): Promise<Message[]> => {
      if (!IS_SUPABASE || !userId) return MOCK_MESSAGES as Message[]

      const { data, error } = await supabase
        .from('messages')
        .select(`*, sender:profiles!sender_id(id, name, email, role, team_id, avatar_url, created_at)`)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as Message[]
    },
  })
}

/** Derived unread badge count — 0 while loading */
export function useUnreadMessageCount(userId: string | null | undefined) {
  const { data } = useAllConversations(userId)
  return (data ?? []).filter(m => m.receiver_id === userId && !m.read_at).length
}
