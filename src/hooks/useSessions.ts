import { useQuery } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_SESSIONS } from '@/lib/mock-data'
import type { Session } from '@/types/database'

export interface SessionsOptions {
  from?: string  // ISO date e.g. '2026-03-01'
  to?: string    // ISO date e.g. '2026-03-31'
}

export function useSessions(
  teamId: string | null | undefined,
  opts: SessionsOptions = {}
) {
  return useQuery({
    queryKey: ['sessions', teamId, opts],
    enabled: !!teamId,
    placeholderData: MOCK_SESSIONS as Session[],
    queryFn: async (): Promise<Session[]> => {
      if (!IS_SUPABASE || !teamId) {
        let filtered = MOCK_SESSIONS as Session[]
        if (opts.from) filtered = filtered.filter(s => s.date >= opts.from!)
        if (opts.to)   filtered = filtered.filter(s => s.date <= opts.to!)
        return filtered
      }

      let q = supabase
        .from('sessions')
        .select('*')
        .eq('team_id', teamId)
        .order('date')

      if (opts.from) q = q.gte('date', opts.from)
      if (opts.to)   q = q.lte('date', opts.to)

      const { data, error } = await q
      if (error) throw new Error(error.message)
      return (data ?? []) as Session[]
    },
  })
}

/** Convenience hook — returns only today's session */
export function useTodaySession(teamId: string | null | undefined) {
  const today = new Date().toISOString().split('T')[0]
  const result = useSessions(teamId, { from: today, to: today })
  return {
    ...result,
    session: (result.data ?? []).find(s => s.date === today) ?? null,
  }
}
