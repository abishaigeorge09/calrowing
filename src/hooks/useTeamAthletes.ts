import { useQuery } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_ATHLETES, MOCK_ATHLETE_PROFILES } from '@/lib/mock-data'
import type { Profile, Athlete } from '@/types/database'

export type AthleteWithProfile = Profile & { athleteProfile: Athlete | null }

function buildMockAthletes(): AthleteWithProfile[] {
  return MOCK_ATHLETES.map(a => ({
    ...a,
    athleteProfile: MOCK_ATHLETE_PROFILES[a.id] ?? null,
  }))
}

export function useTeamAthletes(teamId: string | null | undefined) {
  return useQuery({
    queryKey: ['athletes', teamId],
    enabled: !!teamId,
    placeholderData: IS_SUPABASE ? undefined : buildMockAthletes,
    queryFn: async (): Promise<AthleteWithProfile[]> => {
      if (!IS_SUPABASE || !teamId) return buildMockAthletes()

      const { data, error } = await supabase
        .from('profiles')
        .select('*, athletes(*)')
        .eq('team_id', teamId)
        .eq('role', 'athlete')
        .order('name')

      if (error) throw new Error(error.message)
      if (!data) return []

      return (data as Array<Profile & { athletes: Athlete | null }>).map(r => ({
        ...r,
        athleteProfile: r.athletes,
      }))
    },
  })
}
