import { useQuery } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_WELLNESS_LOGS } from '@/lib/mock-data'
import type { WellnessLog, LogType } from '@/types/database'

export interface WellnessLogsOptions {
  days?: number      // last N days, default 14
  logType?: LogType  // filter by type
}

/** Logs for a single athlete */
export function useWellnessLogs(
  athleteId: string | null | undefined,
  opts: WellnessLogsOptions = {}
) {
  const { days = 14, logType } = opts
  return useQuery({
    queryKey: ['wellnessLogs', athleteId, opts],
    enabled: !!athleteId,
    queryFn: async (): Promise<WellnessLog[]> => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      if (!IS_SUPABASE || !athleteId) {
        let logs = MOCK_WELLNESS_LOGS.filter(l => l.athlete_id === athleteId)
        if (logType) logs = logs.filter(l => l.log_type === logType)
        return logs.filter(l => new Date(l.created_at) >= cutoff) as WellnessLog[]
      }

      let q = supabase
        .from('wellness_logs')
        .select('*')
        .eq('athlete_id', athleteId)
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: true })

      if (logType) q = q.eq('log_type', logType)

      const { data, error } = await q
      if (error) throw new Error(error.message)
      return (data ?? []) as WellnessLog[]
    },
  })
}

/** All team wellness logs for a date window (coach dashboard) — RLS scopes to team */
export function useTeamWellnessLogs(
  teamId: string | null | undefined,
  opts: WellnessLogsOptions = {}
) {
  const { days = 1 } = opts
  return useQuery({
    queryKey: ['teamWellnessLogs', teamId, opts],
    enabled: !!teamId,
    placeholderData: MOCK_WELLNESS_LOGS as WellnessLog[],
    queryFn: async (): Promise<WellnessLog[]> => {
      if (!IS_SUPABASE || !teamId) return MOCK_WELLNESS_LOGS as WellnessLog[]

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      // RLS ensures we only see athletes on our team
      const { data, error } = await supabase
        .from('wellness_logs')
        .select('*')
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as WellnessLog[]
    },
  })
}
