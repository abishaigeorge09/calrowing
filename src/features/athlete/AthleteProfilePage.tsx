import { useState } from 'react'
import { LogOut, User, Moon, Activity, BookOpen, AlertTriangle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '@/lib/utils'
import { useTeam } from '@/hooks/useTeam'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'

export default function AthleteProfilePage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { data: team } = useTeam(user?.team_id)
  const { data: allAthletes = [] } = useTeamAthletes(user?.team_id)
  const athleteData = allAthletes.find(a => a.id === user?.id)
  const athlete = athleteData?.athleteProfile

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
        <div className="flex gap-2 mt-3">
          <Badge variant="secondary">{athlete?.boat_class ?? 'Athlete'}</Badge>
          <Badge variant="secondary">{athlete?.seat_position ?? ''}</Badge>
          <Badge variant="outline">{athlete?.year ?? ''}</Badge>
        </div>
      </div>

      {/* Team */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Team</CardTitle></CardHeader>
        <CardContent>
          <p className="font-semibold text-slate-900">{team?.name}</p>
          <p className="text-sm text-slate-500">{team?.division} · {team?.sport}</p>
        </CardContent>
      </Card>

      {/* Athlete Details */}
      {athlete && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Athlete Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {[
                ['Height', athlete.height_cm ? `${athlete.height_cm} cm` : '—'],
                ['Weight', athlete.weight_kg ? `${athlete.weight_kg} kg` : '—'],
                ['Sleep Goal', `${athlete.sleep_goal}h / night`],
                ['Boat Class', athlete.boat_class],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="font-semibold text-slate-900">{v}</p>
                </div>
              ))}
            </div>
            {athlete.injuries_text && (
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs font-medium text-orange-700">Known issues: {athlete.injuries_text}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="space-y-2">
        {[
          { icon: AlertTriangle, label: 'Flag an Injury', path: '/athlete/injury', color: 'text-red-500' },
          { icon: BookOpen, label: 'Update Academic Schedule', path: '/athlete/academic', color: 'text-blue-500' },
        ].map(({ icon: Icon, label, path, color }) => (
          <button key={path}
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-shadow text-left"
          >
            <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
            <span className="flex-1 font-medium text-slate-900 text-sm">{label}</span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  )
}
