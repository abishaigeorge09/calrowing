import { useQuery } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_PERSONAL_EVENTS } from '@/lib/mock-data'
import type { PersonalEvent } from '@/types/database'

/** Fetch personal events for an athlete on a specific date */
export function usePersonalEvents(
  athleteId: string | null | undefined,
  date: string | null | undefined
) {
  return useQuery({
    queryKey: ['personal_events', athleteId, date],
    enabled: !!athleteId && !!date,
    queryFn: async (): Promise<PersonalEvent[]> => {
      if (!IS_SUPABASE || !athleteId || !date) {
        return MOCK_PERSONAL_EVENTS.filter(
          e => e.athlete_id === athleteId && e.date === date
        ) as PersonalEvent[]
      }
      const { data, error } = await supabase
        .from('personal_events')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('date', date)
        .order('start_time')
      if (error) throw new Error(error.message)
      return (data ?? []) as PersonalEvent[]
    },
  })
}

/** Fetch all personal events for an athlete within a date range (for month view dots) */
export function usePersonalEventsRange(
  athleteId: string | null | undefined,
  from: string | null | undefined,
  to: string | null | undefined
) {
  return useQuery({
    queryKey: ['personal_events', athleteId, from, to],
    enabled: !!athleteId && !!from && !!to,
    queryFn: async (): Promise<PersonalEvent[]> => {
      if (!IS_SUPABASE || !athleteId || !from || !to) {
        return MOCK_PERSONAL_EVENTS.filter(
          e => e.athlete_id === athleteId && e.date >= from! && e.date <= to!
        ) as PersonalEvent[]
      }
      const { data, error } = await supabase
        .from('personal_events')
        .select('*')
        .eq('athlete_id', athleteId)
        .gte('date', from)
        .lte('date', to)
      if (error) throw new Error(error.message)
      return (data ?? []) as PersonalEvent[]
    },
  })
}
