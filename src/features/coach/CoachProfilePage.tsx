import { useState, useEffect } from 'react'
import { LogOut, ChevronRight, Users, Calendar, Edit2, Check, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '@/lib/utils'
import { useTeam } from '@/hooks/useTeam'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useUpdateCoachProfile } from '@/hooks/mutations'

export default function CoachProfilePage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { data: team } = useTeam(user?.team_id)
  const { data: athletes = [] } = useTeamAthletes(user?.team_id)
  const updateProfile = useUpdateCoachProfile()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user?.name ?? '')

  // Sync if user name changes externally
  useEffect(() => {
    if (!isEditing) setEditName(user?.name ?? '')
  }, [user?.name, isEditing])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleSave = async () => {
    await updateProfile.mutateAsync({ name: editName })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(user?.name ?? '')
    setIsEditing(false)
  }

  return (
    <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}
              className="text-[#1e3a5f] gap-1.5">
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-500 gap-1.5">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="flex flex-col items-center py-6 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="w-20 h-20 rounded-full bg-[#1e3a5f] flex items-center justify-center text-2xl font-black text-white mb-3">
          {isEditing
            ? (editName ? getInitials(editName) : <User className="h-8 w-8" />)
            : (user?.name ? getInitials(user.name) : '?')}
        </div>

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="Your name"
            className="text-xl font-bold text-slate-900 text-center border-b-2 border-[#1e3a5f] focus:outline-none bg-transparent w-56 mb-1"
            autoFocus
          />
        ) : (
          <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
        )}

        <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
        <div className="mt-3">
          <Badge variant="secondary">Head Coach</Badge>
        </div>

        {/* Save / Cancel in edit mode */}
        {isEditing && (
          <div className="flex gap-3 mt-5 w-full px-6">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleCancel}>
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={handleSave}
              disabled={updateProfile.isPending || !editName.trim()}
            >
              {updateProfile.isPending ? 'Saving…' : <><Check className="h-4 w-4" /> Save</>}
            </Button>
          </div>
        )}
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
                ? new Date(team.season_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">End</p>
            <p className="font-semibold text-slate-900">
              {team?.season_end
                ? new Date(team.season_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      {!isEditing && (
        <div className="space-y-2">
          {[
            { icon: Users,    label: 'View Roster',       path: '/coach/roster' },
            { icon: Calendar, label: 'Training Calendar', path: '/coach/calendar' },
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
      )}
    </div>
  )
}
