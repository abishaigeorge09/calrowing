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
  otherId: string | null | undefined,
  groupId?: string | null
) {
  const queryClient = useQueryClient()
  const key = groupId ? `group-${groupId}` : (userId && otherId ? conversationKey(userId, otherId) : null)

  const query = useQuery({
    queryKey: ['messages', key],
    enabled: !!(groupId || (userId && otherId)),
    queryFn: async (): Promise<Message[]> => {
      if (!IS_SUPABASE) {
        if (groupId) return [] // No mock group messages
        if (!userId || !otherId) return []
        return MOCK_MESSAGES.filter(
          m => (m.sender_id === userId && m.receiver_id === otherId) ||
               (m.sender_id === otherId && m.receiver_id === userId)
        ) as Message[]
      }

      const baseQuery = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, name, email, role, team_id, avatar_url, created_at),
          receiver:profiles!receiver_id(id, name, email, role, team_id, avatar_url, created_at),
          group:chat_groups(*)
        `)

      let result
      if (groupId) {
        result = await baseQuery.eq('group_id', groupId).order('created_at', { ascending: true })
      } else if (userId && otherId) {
        result = await baseQuery
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: true })
      } else {
        return []
      }

      if (result.error) throw new Error(result.error.message)
      return (result.data ?? []) as Message[]
    },
  })

  // Realtime subscription
  useEffect(() => {
    if (!IS_SUPABASE || !key) return

    const filter = groupId 
      ? `group_id=eq.${groupId}`
      : `receiver_id=eq.${userId}`

    const channel = supabase
      .channel(`messages-${key}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: filter,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', key] })
          if (userId) queryClient.invalidateQueries({ queryKey: ['allConversations', userId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, otherId, groupId, key, queryClient])

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
