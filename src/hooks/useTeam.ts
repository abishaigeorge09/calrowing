import { useQuery } from '@tanstack/react-query'
import { IS_SUPABASE, dbQuery, supabase } from '@/lib/db'
import { MOCK_TEAM } from '@/lib/mock-data'
import type { Team } from '@/types/database'

export function useTeam(teamId: string | null | undefined) {
  return useQuery({
    queryKey: ['team', teamId],
    enabled: !!teamId,
    placeholderData: MOCK_TEAM as Team,
    queryFn: async (): Promise<Team> => {
      if (!IS_SUPABASE || !teamId) return MOCK_TEAM as Team
      return dbQuery(() =>
        supabase.from('teams').select('*').eq('id', teamId).single()
      )
    },
  })
}
