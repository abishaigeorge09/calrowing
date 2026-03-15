import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_PENDING_COACHES, MOCK_ATHLETES, MOCK_TEAM, MOCK_COACH } from '@/lib/mock-data'
import type { Profile } from '@/types/database'

export interface AdminTeam {
  id: string
  name: string
  division: string
  sport?: string
  coachName: string
  athleteCount?: number
}

export interface AdminAthlete {
  id: string
  name: string
  email: string
  team_id: string | null
}

// Mutable demo state — shared across hook calls
const demoPendingCoaches = [...MOCK_PENDING_COACHES]

export interface PendingCoach {
  profile: Profile
  teamName: string
  division: string
}

export interface AdminStats {
  teams: number
  athletes: number
  pending: number
}

export function usePendingCoaches() {
  return useQuery<PendingCoach[]>({
    queryKey: ['pending_coaches'],
    queryFn: async () => {
      if (!IS_SUPABASE) return [...demoPendingCoaches]
      // In Supabase mode: profiles with role=coach and status=pending
      // We'd need a way to get pending team info — for now just return profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coach')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []).map((p: Profile) => ({
        profile: p,
        teamName: 'Pending team info',
        division: '',
      }))
    },
    staleTime: 10_000,
  })
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      if (!IS_SUPABASE) {
        return {
          teams: 1,
          athletes: MOCK_ATHLETES.length,
          pending: demoPendingCoaches.length,
        }
      }
      const [teamsRes, athletesRes, pendingRes] = await Promise.all([
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'athlete'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coach').eq('status', 'pending'),
      ])
      return {
        teams: teamsRes.count ?? 0,
        athletes: athletesRes.count ?? 0,
        pending: pendingRes.count ?? 0,
      }
    },
    staleTime: 30_000,
  })
}

export function useApproveCoach() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (coachId: string) => {
      if (!IS_SUPABASE) {
        const idx = demoPendingCoaches.findIndex(c => c.profile.id === coachId)
        if (idx !== -1) demoPendingCoaches.splice(idx, 1)
        return
      }
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', coachId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_coaches'] })
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] })
    },
  })
}

export function useRejectCoach() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (coachId: string) => {
      if (!IS_SUPABASE) {
        const idx = demoPendingCoaches.findIndex(c => c.profile.id === coachId)
        if (idx !== -1) demoPendingCoaches.splice(idx, 1)
        return
      }
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', coachId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_coaches'] })
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] })
    },
  })
}

export function useAllTeams() {
  return useQuery<AdminTeam[]>({
    queryKey: ['admin_teams'],
    queryFn: async () => {
      if (!IS_SUPABASE) {
        return [{
          id: MOCK_TEAM.id,
          name: MOCK_TEAM.name,
          division: MOCK_TEAM.division,
          sport: MOCK_TEAM.sport,
          coachName: MOCK_COACH.name,
          athleteCount: MOCK_ATHLETES.length,
        }]
      }
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, division, sport')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        division: t.division ?? '',
        sport: t.sport ?? '',
        coachName: '—',
      }))
    },
    staleTime: 30_000,
  })
}

export function useAllAthletes() {
  return useQuery<AdminAthlete[]>({
    queryKey: ['admin_athletes'],
    queryFn: async () => {
      if (!IS_SUPABASE) {
        return MOCK_ATHLETES.map(a => ({ id: a.id, name: a.name, email: a.email, team_id: a.team_id }))
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, team_id')
        .eq('role', 'athlete')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as AdminAthlete[]
    },
    staleTime: 30_000,
  })
}

// Used by RegisterCoachPage to submit a pending coach request in Supabase mode
export async function submitPendingCoachProfile(coachId: string, status: 'pending' | 'active') {
  if (!IS_SUPABASE) return
  await supabase.from('profiles').update({ status }).eq('id', coachId)
}
