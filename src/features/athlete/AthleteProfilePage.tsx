import { useState, useEffect } from 'react'
import {
  LogOut, BookOpen, AlertTriangle, ChevronRight,
  Edit2, Check, X, User, Hexagon
} from 'lucide-react'
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

  const inputClasses = "w-full bg-black/50 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white focus:bg-white/5 transition-all shadow-inner placeholder:text-gray-600"

  return (
    <div className="px-4 py-8 space-y-6 max-w-2xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gray-400" /> Node Identity
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">
            System Profile
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
            <LogOut className="h-3.5 w-3.5" /> Abort
          </button>
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="flex flex-col items-center py-10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-black text-white mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          {isEditing
            ? (editForm.name ? getInitials(editForm.name) : <User className="h-10 w-10 text-gray-400" />)
            : (user?.name ? getInitials(user.name) : '?')}
        </div>

        {isEditing ? (
          <input
            type="text"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Node Designation"
            className="relative z-10 text-2xl font-black text-white text-center border-b border-white/30 focus:border-white focus:outline-none bg-transparent w-64 pb-1 mb-2 placeholder:text-gray-600 block"
          />
        ) : (
          <h2 className="relative z-10 text-2xl font-black text-white tracking-wide mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{user?.name}</h2>
        )}

        <p className="relative z-10 text-gray-400 text-sm font-light tracking-wide">{user?.email}</p>

        {!isEditing && (
          <div className="relative z-10 flex gap-2 mt-4 flex-wrap justify-center">
            {athlete?.boat_class && <span className="bg-white/10 border border-white/20 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest text-white">{athlete.boat_class}</span>}
            {athlete?.seat_position && <span className="bg-white/10 border border-white/20 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest text-white">{athlete.seat_position}</span>}
            {athlete?.year && <span className="bg-black/40 border border-white/10 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest text-gray-400">{athlete.year}</span>}
          </div>
        )}
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col justify-center">
          <h2 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Connected Array</h2>
          <p className="font-black text-xl text-white tracking-wide">{team?.name}</p>
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-2 bg-black/40 inline-block px-3 py-1 rounded-full border border-white/5">{team?.division} · {team?.sport}</p>
        </div>

         {/* Quick actions (only shown in view mode) */}
         {!isEditing && (
          <div className="flex flex-col gap-3">
            {[
              { icon: AlertTriangle, label: 'Flag Hardware Damage', path: '/athlete/injury', color: 'text-red-400', border: 'border-red-500/30', hover: 'hover:bg-red-950/20' },
              { icon: BookOpen, label: 'Update Academic Cycle', path: '/athlete/academic', color: 'text-blue-400', border: 'border-blue-500/30', hover: 'hover:bg-blue-950/20' },
            ].map(({ icon: Icon, label, path, color, border, hover }) => (
              <button key={path}
                onClick={() => navigate(path)}
                className={`w-full flex-1 flex items-center gap-4 bg-white/5 border ${border} rounded-3xl p-5 transition-colors text-left group shadow-[0_0_15px_rgba(0,0,0,0.5)] ${hover}`}
              >
                <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className={`flex-1 font-bold tracking-widest uppercase text-xs ${color} transition-colors`}>{label}</span>
                <ChevronRight className={`h-4 w-4 ${color} opacity-50 group-hover:opacity-100 transition-colors`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Athlete Details — View or Edit */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Node Specifications</h2>
        
        <div className="space-y-6">
          {isEditing ? (
            <>
              {/* Boat class chips */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Class Designation</p>
                <div className="flex flex-wrap gap-2">
                  {BOAT_CLASSES.map(bc => (
                    <button key={bc} type="button"
                      onClick={() => setEditForm({ ...editForm, boat_class: bc })}
                      className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${
                        editForm.boat_class === bc
                          ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'bg-black/50 text-gray-400 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {bc}
                    </button>
                  ))}
                </div>
              </div>

               {/* Seat position */}
              <div className="pt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Vector Position</p>
                <div className="flex flex-wrap gap-2">
                  {SEAT_POSITIONS.map(sp => (
                     <button key={sp} type="button"
                      onClick={() => setEditForm({ ...editForm, seat_position: sp })}
                      className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${
                        editForm.seat_position === sp
                          ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'bg-black/50 text-gray-400 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div className="pt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Lifecycle Stage</p>
                <div className="flex flex-wrap gap-2">
                  {YEARS.map(y => (
                     <button key={y} type="button"
                      onClick={() => setEditForm({ ...editForm, year: y })}
                       className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${
                        editForm.year === y
                          ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'bg-black/50 text-gray-400 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

               {/* Measurements */}
               <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Y-Axis (cm)
                  </label>
                  <input
                    type="number"
                    value={editForm.height_cm}
                    onChange={e => setEditForm({ ...editForm, height_cm: e.target.value })}
                    placeholder="180"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Mass (kg)
                  </label>
                  <input
                    type="number"
                    value={editForm.weight_kg}
                    onChange={e => setEditForm({ ...editForm, weight_kg: e.target.value })}
                    placeholder="75"
                    className={inputClasses}
                  />
                </div>
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Pwr Target (h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="12"
                    value={editForm.sleep_goal}
                    onChange={e => setEditForm({ ...editForm, sleep_goal: e.target.value })}
                    placeholder="8"
                    className={inputClasses}
                  />
                </div>
              </div>

               {/* Known injuries / issues */}
               <div className="pt-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Hardware Damage Reports
                </label>
                <textarea
                  value={editForm.injuries_text || ''}
                  onChange={e => setEditForm({ ...editForm, injuries_text: e.target.value })}
                  placeholder="e.g. Left knee tendinitis..."
                  rows={2}
                  className={`${inputClasses} resize-none min-h-[80px]`}
                />
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button 
                  className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50"
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Writing…' : <><Check className="h-4 w-4" /> Save</>}
                </button>
              </div>
            </>
          ) : (
            // View mode
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                 {[
                  ['Y-Axis (cm)', athlete?.height_cm ? `${athlete.height_cm}` : 'Unk'],
                  ['Mass (kg)', athlete?.weight_kg ? `${athlete.weight_kg}` : 'Unk'],
                  ['Pwr Target', athlete?.sleep_goal ? `${athlete.sleep_goal}H` : 'Unk'],
                  ['Class', athlete?.boat_class ?? 'Unk'],
                  ['Vector', athlete?.seat_position ?? 'Unk'],
                  ['Cycle', athlete?.year ?? 'Unk'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-black/40 border border-white/5 rounded-2xl p-4 shadow-inner">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{k}</p>
                    <p className="font-black text-lg text-white">{v}</p>
                  </div>
                ))}
              </div>
              
              {athlete?.injuries_text && (
                 <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 mt-2 flex items-start gap-4 shadow-inner relative overflow-hidden">
                   <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-24 h-24 bg-red-500/20 blur-[20px] rounded-full pointer-events-none" />
                   <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                   <div className="relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Active Hardware Damage</p>
                     <p className="text-sm font-medium text-red-200 leading-relaxed">{athlete.injuries_text}</p>
                   </div>
                 </div>
              )}
              
              {!athlete && (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-black/20 rounded-2xl border border-white/5 border-dashed">
                  <User className="h-8 w-8 text-gray-600 mb-3" />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Node Data Missing</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-1">Initialize edit sequence to populate</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
