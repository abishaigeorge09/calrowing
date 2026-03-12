import { useState, useEffect } from 'react'
import {
  LogOut, BookOpen, AlertTriangle, ChevronRight,
  Edit2, Check, X, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useNavigate } from 'react-router-dom'
import { getInitials } from '@/lib/utils'
import { useTeam } from '@/hooks/useTeam'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useUpdateAthleteProfile } from '@/hooks/mutations'

const BOAT_CLASSES = ['Varsity 8', 'JV 8', 'Varsity 4', 'JV 4', 'Novice 8', 'Single', 'Double', 'Quad', 'Pair', 'Four']
const SEAT_POSITIONS = ['Stroke', '7', '6', '5', '4', '3', '2', 'Bow', 'Cox', 'Port', 'Starboard']
const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad']

export default function AthleteProfilePage() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { data: team } = useTeam(user?.team_id)
  const { data: allAthletes = [] } = useTeamAthletes(user?.team_id)
  const athleteData = allAthletes.find(a => a.id === user?.id)
  const athlete = athleteData?.athleteProfile
  const updateProfile = useUpdateAthleteProfile()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    height_cm: '',
    weight_kg: '',
    sleep_goal: '8',
    boat_class: '',
    seat_position: '',
    year: '',
    injuries_text: '',
  })

  // Sync form with latest data whenever athlete data loads
  useEffect(() => {
    setEditForm({
      name: user?.name ?? '',
      height_cm: athlete?.height_cm?.toString() ?? '',
      weight_kg: athlete?.weight_kg?.toString() ?? '',
      sleep_goal: athlete?.sleep_goal?.toString() ?? '8',
      boat_class: athlete?.boat_class ?? '',
      seat_position: athlete?.seat_position ?? '',
      year: athlete?.year ?? '',
      injuries_text: athlete?.injuries_text ?? '',
    })
  }, [user?.name, athlete])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      name: editForm.name || undefined,
      height_cm: editForm.height_cm ? parseFloat(editForm.height_cm) : null,
      weight_kg: editForm.weight_kg ? parseFloat(editForm.weight_kg) : null,
      sleep_goal: editForm.sleep_goal ? parseFloat(editForm.sleep_goal) : undefined,
      boat_class: editForm.boat_class || null,
      seat_position: editForm.seat_position || null,
      year: editForm.year || null,
      injuries_text: editForm.injuries_text || null,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Reset form to current values
    setEditForm({
      name: user?.name ?? '',
      height_cm: athlete?.height_cm?.toString() ?? '',
      weight_kg: athlete?.weight_kg?.toString() ?? '',
      sleep_goal: athlete?.sleep_goal?.toString() ?? '8',
      boat_class: athlete?.boat_class ?? '',
      seat_position: athlete?.seat_position ?? '',
      year: athlete?.year ?? '',
      injuries_text: athlete?.injuries_text ?? '',
    })
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
            ? (editForm.name ? getInitials(editForm.name) : <User className="h-8 w-8" />)
            : (user?.name ? getInitials(user.name) : '?')}
        </div>

        {isEditing ? (
          <input
            type="text"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Your name"
            className="text-xl font-bold text-slate-900 text-center border-b-2 border-[#1e3a5f] focus:outline-none bg-transparent w-48 mb-1"
          />
        ) : (
          <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
        )}

        <p className="text-slate-500 text-sm mt-1">{user?.email}</p>

        {!isEditing && (
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            {athlete?.boat_class && <Badge variant="secondary">{athlete.boat_class}</Badge>}
            {athlete?.seat_position && <Badge variant="secondary">{athlete.seat_position}</Badge>}
            {athlete?.year && <Badge variant="outline">{athlete.year}</Badge>}
          </div>
        )}
      </div>

      {/* Team */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Team</CardTitle></CardHeader>
        <CardContent>
          <p className="font-semibold text-slate-900">{team?.name}</p>
          <p className="text-sm text-slate-500">{team?.division} · {team?.sport}</p>
        </CardContent>
      </Card>

      {/* Athlete Details — View or Edit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Athlete Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              {/* Boat class chips */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Boat Class</p>
                <div className="flex flex-wrap gap-2">
                  {BOAT_CLASSES.map(bc => (
                    <button key={bc} type="button"
                      onClick={() => setEditForm({ ...editForm, boat_class: bc })}
                      className={`px-3 py-1 rounded-lg text-sm border-2 transition-all ${
                        editForm.boat_class === bc
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {bc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seat position */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Seat / Position</p>
                <div className="flex flex-wrap gap-2">
                  {SEAT_POSITIONS.map(sp => (
                    <button key={sp} type="button"
                      onClick={() => setEditForm({ ...editForm, seat_position: sp })}
                      className={`px-3 py-1 rounded-lg text-sm border-2 transition-all ${
                        editForm.seat_position === sp
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Year</p>
                <div className="flex flex-wrap gap-2">
                  {YEARS.map(y => (
                    <button key={y} type="button"
                      onClick={() => setEditForm({ ...editForm, year: y })}
                      className={`px-3 py-1 rounded-lg text-sm border-2 transition-all ${
                        editForm.year === y
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Measurements */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={editForm.height_cm}
                    onChange={e => setEditForm({ ...editForm, height_cm: e.target.value })}
                    placeholder="180"
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={editForm.weight_kg}
                    onChange={e => setEditForm({ ...editForm, weight_kg: e.target.value })}
                    placeholder="75"
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                    Sleep Goal (h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="12"
                    value={editForm.sleep_goal}
                    onChange={e => setEditForm({ ...editForm, sleep_goal: e.target.value })}
                    placeholder="8"
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]"
                  />
                </div>
              </div>

              {/* Known injuries / issues */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                  Known Issues / Injuries
                </label>
                <textarea
                  value={editForm.injuries_text}
                  onChange={e => setEditForm({ ...editForm, injuries_text: e.target.value })}
                  placeholder="e.g. Left knee tendinitis, Lower back tightness..."
                  rows={2}
                  className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1e3a5f]"
                />
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={handleCancel}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Saving…' : <><Check className="h-4 w-4" /> Save</>}
                </Button>
              </div>
            </>
          ) : (
            // View mode
            <>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                {[
                  ['Height', athlete?.height_cm ? `${athlete.height_cm} cm` : '—'],
                  ['Weight', athlete?.weight_kg ? `${athlete.weight_kg} kg` : '—'],
                  ['Sleep Goal', athlete?.sleep_goal ? `${athlete.sleep_goal}h / night` : '—'],
                  ['Boat Class', athlete?.boat_class ?? '—'],
                  ['Seat', athlete?.seat_position ?? '—'],
                  ['Year', athlete?.year ?? '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-500">{k}</p>
                    <p className="font-semibold text-slate-900">{v}</p>
                  </div>
                ))}
              </div>
              {athlete?.injuries_text && (
                <div className="bg-orange-50 rounded-xl p-3 mt-1">
                  <p className="text-xs font-medium text-orange-700">Known issues: {athlete.injuries_text}</p>
                </div>
              )}
              {!athlete && (
                <p className="text-sm text-slate-400 text-center py-2">
                  Tap <strong>Edit</strong> to add your athlete details
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick actions (only shown in view mode) */}
      {!isEditing && (
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
      )}
    </div>
  )
}
