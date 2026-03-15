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
  coachEmail?: string
  coachId?: string
  athleteCount?: number
  createdAt?: string
}

export interface AdminAthlete {
  id: string
  name: string
  email: string
  team_id: string | null
  teamName?: string
  createdAt?: string
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*, team:teams!team_id(name, division)')
        .eq('role', 'coach')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []).map((p: any) => ({
        profile: p as Profile,
        teamName: p.team?.name ?? 'No team yet',
        division: p.team?.division ?? '',
      }))
    },
    staleTime: 0,
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
        // Count only teams with an approved (active) coach
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'coach')
          .eq('status', 'active')
          .not('team_id', 'is', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'athlete'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coach').eq('status', 'pending'),
      ])
      return {
        teams: teamsRes.count ?? 0,
        athletes: athletesRes.count ?? 0,
        pending: pendingRes.count ?? 0,
      }
    },
    staleTime: 0,
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
      queryClient.invalidateQueries({ queryKey: ['admin_teams'] })
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
          coachEmail: 'coach@rowiq.demo',
          coachId: MOCK_COACH.id,
          athleteCount: MOCK_ATHLETES.length,
          createdAt: new Date().toISOString(),
        }]
      }
      // Query active coaches and join their team via profiles.team_id → teams.id
      // (teams.coach_id refs auth.users, not profiles — so we join from the profiles side)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, team_id, team:teams!team_id(id, name, division, sport, created_at)')
        .eq('role', 'coach')
        .eq('status', 'active')
        .not('team_id', 'is', null)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []).map((p: any) => ({
        id: p.team?.id ?? p.team_id,
        name: p.team?.name ?? '—',
        division: p.team?.division ?? '',
        sport: p.team?.sport ?? '',
        coachName: p.name,
        coachEmail: p.email,
        coachId: p.id,
        createdAt: p.team?.created_at,
      }))
    },
    staleTime: 0,
  })
}

export function useAllAthletes() {
  return useQuery<AdminAthlete[]>({
    queryKey: ['admin_athletes'],
    queryFn: async () => {
      if (!IS_SUPABASE) {
        return MOCK_ATHLETES.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          team_id: a.team_id,
          teamName: MOCK_TEAM.name,
          createdAt: new Date().toISOString(),
        }))
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, team_id, created_at, team:teams!team_id(name)')
        .eq('role', 'athlete')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        team_id: a.team_id,
        teamName: a.team?.name ?? 'No team',
        createdAt: a.created_at,
      }))
    },
    staleTime: 0,
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!IS_SUPABASE) return
      // Unlink all profiles from this team first (prevents FK violation)
      await supabase.from('profiles').update({ team_id: null }).eq('team_id', teamId)
      const { error } = await supabase.from('teams').delete().eq('id', teamId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_teams'] })
      queryClient.invalidateQueries({ queryKey: ['admin_athletes'] })
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] })
    },
  })
}

export function useDeleteAthlete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (athleteId: string) => {
      if (!IS_SUPABASE) return
      const { error } = await supabase.from('profiles').delete().eq('id', athleteId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_athletes'] })
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] })
    },
  })
}

// Used by RegisterCoachPage to submit a pending coach request in Supabase mode
export async function submitPendingCoachProfile(coachId: string, status: 'pending' | 'active') {
  if (!IS_SUPABASE) return
  await supabase.from('profiles').update({ status }).eq('id', coachId)
}
