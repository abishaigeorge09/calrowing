import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Hexagon, Users, Building2, Clock, CheckCircle2, XCircle,
  LogOut, ChevronRight, ChevronDown, Trash2, Mail, Calendar, Shield,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import {
  usePendingCoaches, useAdminStats, useApproveCoach, useRejectCoach,
  useAllTeams, useAllAthletes, useDeleteTeam, useDeleteAthlete,
} from '@/hooks/useSuperadmin'
import { getInitials } from '@/lib/utils'

export default function SuperadminDashboard() {
  const { signOut } = useAuthStore()
  const navigate = useNavigate()
  const { data: stats } = useAdminStats()
  const { data: pending = [], isLoading } = usePendingCoaches()
  const { data: teams = [], isLoading: teamsLoading } = useAllTeams()
  const { data: athletes = [], isLoading: athletesLoading } = useAllAthletes()
  const approveCoach = useApproveCoach()
  const rejectCoach = useRejectCoach()
  const deleteTeam = useDeleteTeam()
  const deleteAthlete = useDeleteAthlete()

  const [actionId, setActionId] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    setActionId(id)
    await approveCoach.mutateAsync(id)
    setActionId(null)
  }

  const handleReject = async (id: string) => {
    setActionId(id)
    await rejectCoach.mutateAsync(id)
    setActionId(null)
  }

  const handleDeleteTeam = async (id: string) => {
    setDeleteError(null)
    try {
      await deleteTeam.mutateAsync(id)
      setSelectedTeamId(null)
      setConfirmDeleteId(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed')
      setConfirmDeleteId(null)
    }
  }

  const handleDeleteAthlete = async (id: string) => {
    setDeleteError(null)
    try {
      await deleteAthlete.mutateAsync(id)
      setSelectedAthleteId(null)
      setConfirmDeleteId(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed')
      setConfirmDeleteId(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const formatDate = (iso?: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="relative min-h-dvh bg-black text-white overflow-hidden font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-white/[0.03] blur-[100px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Hexagon className="h-5 w-5 text-white" strokeWidth={1.5} />
          <span className="font-black text-white tracking-widest uppercase text-sm">RowIQ</span>
          <span className="ml-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/15 text-gray-400">Admin</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-white transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Review coach registration requests and monitor platform growth.</p>
        </div>

        {/* Global delete error */}
        {deleteError && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{deleteError}</p>
            <button onClick={() => setDeleteError(null)} className="ml-auto text-red-500 hover:text-red-300 text-[10px]">✕</button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Teams', value: stats?.teams ?? '—', icon: Building2, color: 'text-blue-400' },
            { label: 'Athletes', value: stats?.athletes ?? '—', icon: Users, color: 'text-green-400' },
            { label: 'Pending', value: stats?.pending ?? '—', icon: Clock, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 text-center">
              <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
              <div className="text-2xl font-black text-white mb-0.5">{value}</div>
              <div className="text-[9px] uppercase tracking-widest font-bold text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Pending requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Pending Coach Requests</h2>
            {pending.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                {pending.length} waiting
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-600 text-[10px] uppercase tracking-widest font-bold">Loading…</div>
          ) : pending.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500/50 mx-auto mb-3" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">All caught up — no pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(({ profile, teamName, division }) => {
                const busy = actionId === profile.id
                const date = new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })
                return (
                  <div key={profile.id} className="bg-white/[0.04] border border-white/8 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm mb-0.5 truncate">{profile.name}</div>
                        <div className="text-xs text-gray-500 truncate">{profile.email}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600">Applied</div>
                        <div className="text-[10px] text-gray-400 font-bold">{date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 bg-black/40 border border-white/8 rounded-xl px-3 py-2">
                        <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-0.5">Team</div>
                        <div className="text-xs font-bold text-white truncate">{teamName}</div>
                      </div>
                      {division && (
                        <div className="bg-black/40 border border-white/8 rounded-xl px-3 py-2 shrink-0">
                          <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-0.5">Division</div>
                          <div className="text-xs font-bold text-white">{division}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(profile.id)}
                        disabled={busy}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-500/25 bg-red-950/20 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-950/40 transition-all disabled:opacity-40"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(profile.id)}
                        disabled={busy}
                        className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {busy ? 'Processing…' : 'Approve'}
                        {!busy && <ChevronRight className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Teams list */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">
            Teams <span className="text-gray-600">({teams.length})</span>
          </h2>
          {teamsLoading ? (
            <div className="text-center py-8 text-gray-600 text-[10px] uppercase tracking-widest font-bold">Loading…</div>
          ) : teams.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-600">No approved teams yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map(team => {
                const isExpanded = selectedTeamId === team.id
                const isConfirming = confirmDeleteId === team.id
                return (
                  <div key={team.id} className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
                    {/* Row */}
                    <button
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left"
                      onClick={() => {
                        setSelectedTeamId(isExpanded ? null : team.id)
                        setConfirmDeleteId(null)
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{team.name}</div>
                        <div className="text-[10px] text-gray-500">
                          {team.coachName}{team.division ? ` · ${team.division}` : ''}
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-white/8 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {team.sport && (
                            <div className="bg-black/40 rounded-lg px-3 py-2">
                              <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-0.5">Sport</div>
                              <div className="text-xs font-bold text-white">{team.sport}</div>
                            </div>
                          )}
                          {team.division && (
                            <div className="bg-black/40 rounded-lg px-3 py-2">
                              <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-0.5">Division</div>
                              <div className="text-xs font-bold text-white">{team.division}</div>
                            </div>
                          )}
                          <div className="bg-black/40 rounded-lg px-3 py-2">
                            <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-0.5">Athletes</div>
                            <div className="text-xs font-bold text-white">{team.athleteCount ?? '—'}</div>
                          </div>
                          <div className="bg-black/40 rounded-lg px-3 py-2">
                            <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-0.5">Created</div>
                            <div className="text-xs font-bold text-white">{formatDate(team.createdAt)}</div>
                          </div>
                        </div>

                        {/* Coach info */}
                        <div className="bg-black/40 rounded-lg px-3 py-2 space-y-1">
                          <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600">Coach</div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-blue-400 shrink-0" />
                            <span className="text-xs font-bold text-white truncate">{team.coachName}</span>
                          </div>
                          {team.coachEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-500 shrink-0" />
                              <span className="text-[10px] text-gray-400 truncate">{team.coachEmail}</span>
                            </div>
                          )}
                        </div>

                        {/* Delete section */}
                        {isConfirming ? (
                          <div className="bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2.5">
                            <p className="text-[10px] text-red-400 font-bold mb-2">
                              Delete team and unlink all athletes? This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(team.id)}
                                disabled={deleteTeam.isPending}
                                className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-40"
                              >
                                {deleteTeam.isPending ? 'Deleting…' : 'Confirm Delete'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(team.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Team
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Athletes list */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">
            Athletes <span className="text-gray-600">({athletes.length})</span>
          </h2>
          {athletesLoading ? (
            <div className="text-center py-8 text-gray-600 text-[10px] uppercase tracking-widest font-bold">Loading…</div>
          ) : athletes.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-600">No athletes yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {athletes.map(athlete => {
                const isExpanded = selectedAthleteId === athlete.id
                const isConfirming = confirmDeleteId === athlete.id
                return (
                  <div key={athlete.id} className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
                    {/* Row */}
                    <button
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left"
                      onClick={() => {
                        setSelectedAthleteId(isExpanded ? null : athlete.id)
                        setConfirmDeleteId(null)
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-[10px] font-black text-gray-300">
                        {getInitials(athlete.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{athlete.name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{athlete.email}</div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-white/8 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-black/40 rounded-lg px-3 py-2">
                            <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-0.5">Team</div>
                            <div className="text-xs font-bold text-white truncate">{athlete.teamName ?? 'No team'}</div>
                          </div>
                          <div className="bg-black/40 rounded-lg px-3 py-2">
                            <div className="text-[9px] uppercase tracking-widest font-bold text-gray-600 mb-0.5">Joined</div>
                            <div className="text-xs font-bold text-white">{formatDate(athlete.createdAt)}</div>
                          </div>
                        </div>

                        <div className="bg-black/40 rounded-lg px-3 py-2 flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-500 shrink-0" />
                          <span className="text-[10px] text-gray-400 truncate">{athlete.email}</span>
                        </div>

                        {/* Delete section */}
                        {isConfirming ? (
                          <div className="bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2.5">
                            <p className="text-[10px] text-red-400 font-bold mb-2">
                              Remove this athlete? Their account will be deleted.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteAthlete(athlete.id)}
                                disabled={deleteAthlete.isPending}
                                className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-40"
                              >
                                {deleteAthlete.isPending ? 'Removing…' : 'Confirm Remove'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(athlete.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove Athlete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-gray-700 uppercase tracking-widest font-bold pb-8">
          RowIQ Superadmin · Access restricted
        </p>
      </div>
    </div>
  )
}
