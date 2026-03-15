import { useState, useEffect } from 'react'
import { LogOut, ChevronRight, Users, Calendar, Edit2, Check, X, User, Hexagon } from 'lucide-react'
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
    <div className="px-4 py-8 space-y-6 max-w-2xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
            <Hexagon className="h-5 w-5 text-gray-400" /> My Profile
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">
            Coach profile
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/20 text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button 
            onClick={handleSignOut} 
            className="p-2 border border-red-500/30 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="flex flex-col items-center py-10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-black text-white mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          {isEditing
            ? (editName ? getInitials(editName) : <User className="h-10 w-10 text-gray-400" />)
            : (user?.name ? getInitials(user.name) : '?')}
        </div>

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="Full Name"
            className="relative z-10 text-2xl font-black text-white text-center border-b border-white/30 focus:border-white focus:outline-none bg-transparent w-64 pb-1 mb-2 placeholder:text-gray-600 block"
            autoFocus
          />
        ) : (
          <h2 className="relative z-10 text-2xl font-black text-white tracking-wide mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{user?.name}</h2>
        )}

        <p className="relative z-10 text-gray-400 text-sm font-light tracking-wide">{user?.email}</p>
        
        <div className="relative z-10 mt-4">
          <span className="bg-white/10 border border-white/20 px-3 py-1 rounded text-[10px] uppercase font-black tracking-widest text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]">Coach</span>
        </div>

        {/* Save / Cancel in edit mode */}
        {isEditing && (
          <div className="relative z-10 flex gap-4 mt-8 w-full px-8 max-w-sm">
            <button 
              className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:bg-white/10 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50"
              onClick={handleSave}
              disabled={updateProfile.isPending || !editName.trim()}
            >
              {updateProfile.isPending ? 'Writing…' : <><Check className="h-4 w-4" /> Confirm</>}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Info */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Team Info</h2>

          <div className="space-y-4">
            <div>
              <p className="font-bold text-lg text-white tracking-wide">{team?.name}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">{team?.division} · {team?.sport}</p>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex-1">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Athletes</p>
                <p className="font-black text-xl text-white">{athletes.length}</p>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-[20px] rounded-full" />
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 relative z-10">Invite Code</p>
                <p className="font-black text-lg text-white tracking-widest relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{team?.invite_code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Season */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Season</h2>

          <div className="grid grid-cols-2 gap-4 h-[calc(100%-3rem)] content-center text-center">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-center shadow-inner">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2">Season Start</p>
              <p className="font-black text-white text-sm">
                {team?.season_start
                  ? new Date(team.season_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-center shadow-inner">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2">Season End</p>
              <p className="font-black text-white text-sm">
                {team?.season_end
                  ? new Date(team.season_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      {!isEditing && (
        <div className="grid gap-3 pt-2">
          {[
            { icon: Users,    label: 'View Roster',     path: '/coach/roster' },
            { icon: Calendar, label: 'Schedule',         path: '/coach/calendar' },
          ].map(({ icon: Icon, label, path }) => (
            <button key={path}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors text-left group shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors border border-white/20">
                <Icon className="h-5 w-5 text-white group-hover:text-black" />
              </div>
              <span className="flex-1 font-bold tracking-widest uppercase text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
              <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
