import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { useAuthStore } from '@/stores/auth'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  action_url: string | null
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

/** Fetch all notifications for current user, newest first */
export function useNotifications() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user?.id && IS_SUPABASE,
    queryFn: async (): Promise<Notification[]> => {
      if (!IS_SUPABASE || !user?.id) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw new Error(error.message)
      return (data ?? []) as Notification[]
    },
  })

  // Realtime subscription: invalidate when new notification arrives
  useEffect(() => {
    if (!IS_SUPABASE || !user?.id) return

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, queryClient])

  return query
}

/** Unread notification count for badge display */
export function useUnreadNotificationCount() {
  const { data = [] } = useNotifications()
  return data.filter(n => !n.read_at).length
}

/** Mark a single notification as read */
export function useMarkNotificationRead() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!IS_SUPABASE || !user?.id) return
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    },
  })
}

/** Mark all notifications as read */
export function useMarkAllNotificationsRead() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!IS_SUPABASE || !user?.id) return
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    },
  })
}
