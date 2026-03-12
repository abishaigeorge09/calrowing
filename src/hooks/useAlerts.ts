import { useQuery } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_ALERTS } from '@/lib/mock-data'
import type { Alert } from '@/types/database'

export function useAlerts(coachId: string | null | undefined) {
  return useQuery({
    queryKey: ['alerts', coachId, 'unreviewed'],
    enabled: !!coachId,
    refetchInterval: 30_000,
    placeholderData: IS_SUPABASE ? undefined : MOCK_ALERTS.filter(a => !a.reviewed_at) as Alert[],
    queryFn: async (): Promise<Alert[]> => {
      if (!IS_SUPABASE || !coachId) {
        return MOCK_ALERTS.filter(a => !a.reviewed_at) as Alert[]
      }

      const { data, error } = await supabase
        .from('alerts')
        .select('*, athlete:profiles!athlete_id(id, name, email, role, team_id, avatar_url, created_at)')
        .eq('coach_id', coachId)
        .is('reviewed_at', null)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as Alert[]
    },
  })
}

/** Derived badge count — 0 while loading */
export function useUnreadAlertCount(coachId: string | null | undefined) {
  const { data } = useAlerts(coachId)
  return (data ?? []).filter(a => !a.reviewed_at).length
}
