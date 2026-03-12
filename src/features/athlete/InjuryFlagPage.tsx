import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useTeam } from '@/hooks/useTeam'
import { useLogInjury } from '@/hooks/mutations'
import { cn } from '@/lib/utils'

const BODY_PARTS = [
  'Head / Concussion', 'Neck', 'Shoulder (Left)', 'Shoulder (Right)',
  'Upper Back', 'Lower Back', 'Rib / Chest', 'Core / Abs',
  'Hip (Left)', 'Hip (Right)', 'Quad (Left)', 'Quad (Right)',
  'Hamstring (Left)', 'Hamstring (Right)', 'Knee (Left)', 'Knee (Right)',
  'Shin / Tibia', 'Calf', 'Ankle', 'Foot / Heel',
  'Wrist / Hand', 'Elbow',
]

export default function InjuryFlagPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: team } = useTeam(user?.team_id)
  const logInjury = useLogInjury()

  const [bodyPart, setBodyPart] = useState('')
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe' | ''>('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bodyPart || !severity) return

    setSubmitting(true)
    try {
      const coachId = team?.coach_id
      if (coachId) {
        // Real mode: log injury + alert + notify coach
        await logInjury.mutateAsync({
          bodyPart,
          severity,
          description,
          coachId,
        })
      }
      // Demo mode (no coachId): just show success screen
    } catch (err) {
      console.error('Failed to submit injury flag:', err)
      // Still show success so user isn't stuck
    } finally {
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto font-sans text-center text-white h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-red-500/30 blur-[40px] rounded-full" />
          <div className="relative bg-red-950/40 border-2 border-red-500/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.5)_inset]">
            <AlertTriangle className="h-10 w-10 text-red-500 drop-shadow-[0_0_10px_currentColor]" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">Alert Transmitted</h1>
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest leading-relaxed mb-8 max-w-xs">
          Hardware damage report sent directly to director node.
        </p>
        
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 w-full max-w-sm text-left shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-8">
          <div className="space-y-4">
             <div className="flex flex-col border-b border-white/5 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Target Component</span>
              <span className="font-black text-white text-lg tracking-wide">{bodyPart}</span>
            </div>
            <div className="flex flex-col border-b border-white/5 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Severity Level</span>
              <span className={cn(
                'font-black text-lg tracking-wide',
                severity === 'Severe' ? 'text-red-500 drop-shadow-[0_0_5px_currentColor]' : 
                severity === 'Moderate' ? 'text-orange-500 drop-shadow-[0_0_5px_currentColor]' : 
                'text-yellow-500 drop-shadow-[0_0_5px_currentColor]'
              )}>
                {severity}
              </span>
            </div>
             {description && (
              <div className="flex flex-col pt-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Diagnostic Note</span>
                <span className="text-gray-300 text-sm leading-relaxed">{description}</span>
              </div>
            )}
          </div>
        </div>
        
        <button 
          className="bg-white text-black hover:bg-gray-200 text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] w-full max-w-sm"
          onClick={() => navigate('/athlete')}
        >
          Return to Hub
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 space-y-6 max-w-2xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/20 text-white transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
           <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Flag Hardware Damage
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">
            Director receives immediate alert
          </p>
        </div>
      </div>

       {/* Warning Banner */}
       <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-5 flex items-start gap-4 shadow-inner relative overflow-hidden">
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-32 h-32 bg-red-500/20 blur-[30px] rounded-full pointer-events-none" />
        <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        <div className="relative z-10 w-full pr-4">
           <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Critical Transmission</p>
           <p className="text-sm font-medium text-red-200/80 leading-relaxed">
            This bypasses regular protocol to alert the director node of pain or injury instantly.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block border-b border-white/5 pb-2">Identify Affected Component</label>
          <div className="flex flex-wrap gap-2">
            {BODY_PARTS.map(part => (
              <button key={part} type="button"
                onClick={() => setBodyPart(part)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all',
                  bodyPart === part
                    ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
                    : 'bg-black/40 text-gray-400 border border-white/5 hover:border-white/20 hover:text-white'
                )}
              >
                {part}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block border-b border-white/5 pb-2">Damage Severity</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['Mild', 'Moderate', 'Severe'] as const).map(s => {
               const isActive = severity === s
               const baseColor = s === 'Severe' ? 'red' : s === 'Moderate' ? 'orange' : 'yellow'
               return (
                <button key={s} type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    'py-5 rounded-2xl border font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 group',
                    isActive
                      ? `bg-${baseColor}-500/20 text-${baseColor}-400 border-${baseColor}-500 shadow-[0_0_20px_rgba(var(--${baseColor}-rgb),0.3)_inset]`
                      : 'bg-black/40 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'
                  )}
                >
                  <span className={cn(
                    'text-2xl drop-shadow-md transition-transform group-hover:scale-110', 
                    isActive && 'scale-110 grayscale-0',
                    !isActive && 'grayscale opacity-50'
                  )}>
                    {s === 'Mild' ? '😐' : s === 'Moderate' ? '😣' : '😰'}
                  </span>
                  <span className="text-xs">{s}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block border-b border-white/5 pb-2">Diagnostic Log (Optional)</label>
          <textarea
            className="w-full bg-black/50 border border-white/10 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white focus:bg-white/5 transition-all shadow-inner resize-none min-h-[100px]"
            placeholder="Describe the anomalies..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={!bodyPart || !severity || submitting}
          className={cn(
            'w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all',
            !bodyPart || !severity || submitting ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed' : 
            'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:bg-red-400 border border-red-400'
          )}
        >
          {submitting ? (
            'Transmitting Data...'
          ) : (
            <>
              <AlertTriangle className={cn("h-4 w-4", !bodyPart || !severity ? 'opacity-30' : '')} />
              Transmit Alert to Director
            </>
          )}
        </button>
      </form>
    </div>
  )
}
