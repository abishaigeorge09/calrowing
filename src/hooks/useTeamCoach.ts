import { useQuery } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_COACH } from '@/lib/mock-data'
import type { Profile } from '@/types/database'
import { useTeam } from './useTeam'

export function useTeamCoach(teamId: string | null | undefined) {
  const { data: team } = useTeam(teamId)
  const coachId = team?.coach_id ?? null

  return useQuery({
    queryKey: ['teamCoach', teamId],
    // In demo mode: always enabled (queryFn returns MOCK_COACH)
    // In Supabase mode: wait for coachId to be available
    enabled: !IS_SUPABASE || !!coachId,
    placeholderData: IS_SUPABASE ? undefined : MOCK_COACH as Profile,
    queryFn: async (): Promise<Profile> => {
      if (!IS_SUPABASE) return MOCK_COACH as Profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', coachId!)
        .single()
      if (error) throw new Error(error.message)
      return data as Profile
    },
  })
}
