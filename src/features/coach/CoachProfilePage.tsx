import { LogOut, ChevronRight, Users, Calendar, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '@/lib/utils'
import { useTeam } from '@/hooks/useTeam'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'

export default function CoachProfilePage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { data: team } = useTeam(user?.team_id)
  const { data: athletes = [] } = useTeamAthletes(user?.team_id)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-500 gap-1.5">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Avatar + Info */}
      <div className="flex flex-col items-center py-6 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="w-20 h-20 rounded-full bg-[#1e3a5f] flex items-center justify-center text-2xl font-black text-white mb-3">
          {user?.name ? getInitials(user.name) : '?'}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
        <p className="text-slate-500 text-sm">{user?.email}</p>
        <div className="mt-3">
          <Badge variant="secondary">Head Coach</Badge>
        </div>
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-semibold text-slate-900">{team?.name}</p>
          <p className="text-sm text-slate-500">{team?.division} · {team?.sport}</p>
          <div className="flex items-center gap-4 pt-1">
            <div>
              <p className="text-xs text-slate-400">Athletes</p>
              <p className="font-bold text-slate-900">{athletes.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Invite Code</p>
              <p className="font-bold text-[#1e3a5f] tracking-widest">{team?.invite_code}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Season</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Start</p>
            <p className="font-semibold text-slate-900">
              {team?.season_start
                ? new Date(team?.season_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">End</p>
            <p className="font-semibold text-slate-900">
              {team?.season_end
                ? new Date(team?.season_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="space-y-2">
        {[
          { icon: Users,    label: 'View Roster',          path: '/coach/roster' },
          { icon: Calendar, label: 'Training Calendar',    path: '/coach/calendar' },
        ].map(({ icon: Icon, label, path }) => (
          <button key={path}
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-shadow text-left"
          >
            <Icon className="h-5 w-5 text-[#1e3a5f] flex-shrink-0" />
            <span className="flex-1 font-medium text-slate-900 text-sm">{label}</span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  )
}
