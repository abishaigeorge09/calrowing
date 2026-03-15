import { useState } from 'react'
import { CheckCircle2, X, AlertTriangle, Hexagon } from 'lucide-react'
import { TapRating, Slider } from '@/components/ui/slider'
import { useSubmitWellnessLog } from '@/hooks/mutations'
import type { Session } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  session: Session
  onClose: () => void
  onDone: () => void
  coachId?: string
}

const BODY_PARTS = ['Head', 'Neck', 'Shoulder (L)', 'Shoulder (R)', 'Upper Back', 'Lower Back', 'Core', 'Hip', 'Quad', 'Hamstring', 'Knee', 'Calf']

export default function PostSessionForm({ session, onClose, onDone, coachId }: Props) {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const submitLog = useSubmitWellnessLog()
  const [form, setForm] = useState({
    completion: 'full' as 'full' | 'partial' | 'dnf',
    dnf_reason: '',
    rpe: 7,
    legs_fatigue: 3,
    back_core_fatigue: 3,
    breathing_difficulty: 3,
    has_pain: false,
    pain_body_part: '',
    pain_level: 3,
    hit_target_splits: 'close' as 'yes' | 'close' | 'no',
    felt_good: '',
    felt_off: '',
    recovery_status: 3,
    ready_tomorrow: 'yes' as 'yes' | 'maybe' | 'no',
    studying_tonight: false,
    study_hours: '2',
    academic_stress: 2,
    note: '',
  })

  const steps = [
    { title: 'Status', emoji: '🏁' },
    { title: 'Metrics', emoji: '⚙️' },
    { title: 'Damage', emoji: '⚠️' },
    { title: 'Target', emoji: '🎯' },
    { title: 'Regen', emoji: '🔋' },
    { title: 'Submitted', emoji: '✅' },
  ]

  const handleSubmit = async () => {
    await submitLog.mutateAsync({
      logType: 'post',
      sessionId: session.id,
      coachId,
      data: {
        completion: form.completion,
        dnf_reason: form.dnf_reason || undefined,
        rpe: form.rpe,
        legs_fatigue: form.legs_fatigue,
        back_core_fatigue: form.back_core_fatigue,
        breathing_difficulty: form.breathing_difficulty,
        has_pain: form.has_pain,
        pain_body_part: form.has_pain ? form.pain_body_part : undefined,
        pain_level: form.has_pain ? form.pain_level : undefined,
        hit_target_splits: form.hit_target_splits,
        felt_good: form.felt_good || undefined,
        felt_off: form.felt_off || undefined,
        recovery_status: form.recovery_status,
        ready_tomorrow: form.ready_tomorrow,
        studying_tonight: form.studying_tonight,
        study_hours: form.studying_tonight ? parseInt(form.study_hours) : undefined,
        academic_stress: form.academic_stress,
        note_to_coach: form.note || undefined,
      },
    })
    setSubmitted(true)
    setStep(steps.length - 1)
  }

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const rpeColors = [
    '', '#4ade80', '#86efac', '#fde047', '#facc15', '#eab308',
    '#f97316', '#ea580c', '#ef4444', '#dc2626', '#b91c1c',
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col justify-end" style={{ zIndex: 9999 }}>
      <div className="bg-black/95 border-t border-white/10 w-full rounded-t-[2.5rem] px-6 pt-8 pb-10 safe-bottom max-h-[92dvh] overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative">
        <div className="absolute top-0 left-3/4 -translate-y-1/2 w-32 h-32 bg-yellow-500/20 blur-[50px] rounded-full pointer-events-none" />

        {/* Header */}
         <div className="flex items-center justify-between mb-6 relative z-10 w-full max-w-sm mx-auto">
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Post-Session Check-in</p>
             <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              {step !== steps.length - 1 ? (
                <>
                  <span className="bg-white/10 p-2 rounded-xl border border-white/20 shadow-inner text-lg leading-none">
                    {steps[step].emoji}
                  </span>
                  {steps[step].title}
                </>
              ) : 'All Done!'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 text-white transition-colors shadow-inner">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
         <div className="w-full max-w-sm mx-auto bg-white/10 rounded-full h-1.5 mb-8 relative z-10 overflow-hidden shadow-inner border border-white/5 flex gap-1">
          {steps.map((_, i) => (
             <div key={i} className={cn(
              'h-full rounded-full transition-all',
              i <= step ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]' : 'bg-transparent',
              i === steps.length - 1 ? 'flex-0' : 'flex-1' // hide last tick unless completed
            )} />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-sm mx-auto min-h-[40vh] flex flex-col pt-2">
          {step === 0 && (
            <div className="space-y-6 flex-1 pb-4">
              <div className="space-y-4">
                 <p className="text-[10px] items-center gap-2 uppercase font-black tracking-widest text-gray-400 block mb-4 flex"><Hexagon className="w-3.5 h-3.5"/>Session Completion</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: 'full', label: '100% Done', emoji: '✅', color: 'green' },
                    { value: 'partial', label: 'Partial', emoji: '⚠️', color: 'yellow' },
                    { value: 'dnf', label: 'Did Not Finish', emoji: '❌', color: 'red' },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, completion: opt.value })}
                      className={cn(
                        'py-5 px-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-2',
                        form.completion === opt.value
                           ? `bg-${opt.color}-500/20 text-${opt.color}-400 border-${opt.color}-500 shadow-[0_0_15px_rgba(var(--${opt.color}-rgb),0.3)_inset]`
                          : 'bg-black/40 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'
                      )}
                    >
                      <div className={cn(
                        "text-2xl drop-shadow-md",
                        form.completion !== opt.value && "grayscale opacity-50"
                      )}>{opt.emoji}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

               {(form.completion === 'partial' || form.completion === 'dnf') && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                   <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">Reason</p>
                  <div className="flex flex-wrap gap-2">
                    {['Pain/Injury', 'Too Hard', 'Time Constraint', 'Illness', 'Other'].map(r => (
                      <button key={r} type="button"
                        onClick={() => setForm({ ...form, dnf_reason: r })}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
                          form.dnf_reason === r ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/20'
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 flex-1 pb-4">
              {/* RPE */}
              <div className="space-y-4">
                 <p className="text-[10px] items-center gap-2 uppercase font-black tracking-widest text-gray-400 block mb-3 flex"><span className="text-yellow-500">⚡</span> Effort Level (RPE)</p>
                <div className="flex flex-col items-center mb-6 bg-black/40 border border-white/5 rounded-3xl py-6 shadow-inner relative overflow-hidden">
                   <div 
                    className="absolute inset-0 opacity-20 transition-colors duration-300" 
                    style={{ backgroundColor: rpeColors[form.rpe] }} 
                  />
                  <div className="flex items-end gap-1 relative z-10">
                     <span className="text-6xl font-black drop-shadow-[0_0_10px_currentColor] transition-colors duration-300" style={{ color: rpeColors[form.rpe] }}>{form.rpe}</span>
                     <span className="text-xl font-bold uppercase tracking-widest text-gray-500 mb-2 border-b-2 border-gray-600 pb-1 w-10 text-center">/10</span>
                  </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2 relative z-10">
                    {form.rpe <= 3 ? 'Light Effort' : form.rpe <= 5 ? 'Moderate Effort' : form.rpe <= 7 ? 'Hard Effort' : form.rpe <= 9 ? 'Very Hard Effort' : 'Max Effort'}
                  </p>
                </div>
                <Slider min={1} max={10} value={form.rpe} onChange={v => setForm({ ...form, rpe: v })} showValue={false} 
                  colorClass={cn(
                    form.rpe <= 3 ? 'accent-green-500' : 
                    form.rpe <= 6 ? 'accent-yellow-500' : 
                    form.rpe <= 8 ? 'accent-orange-500' : 'accent-red-600'
                  )} />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-2">
                  <span>1 (IDLE)</span><span>5 (NOM)</span><span>10 (MAX)</span>
                </div>
              </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">Leg Fatigue</p>
                <TapRating min={1} max={5} value={form.legs_fatigue}
                  onChange={v => setForm({ ...form, legs_fatigue: v })}
                  labels={['Fresh', 'Light', 'Nom', 'Heavy', 'Dead'].map(l => l.toUpperCase())}
                />
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                 <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">Core/Back Fatigue</p>
                <TapRating min={1} max={5} value={form.back_core_fatigue}
                  onChange={v => setForm({ ...form, back_core_fatigue: v })}
                  labels={['Fresh', 'Light', 'Nom', 'Heavy', 'Spent'].map(l => l.toUpperCase())}
                />
              </div>
               <div className="space-y-4 pt-4 border-t border-white/5">
                 <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">Breathing Difficulty</p>
                <TapRating min={1} max={5} value={form.breathing_difficulty}
                  onChange={v => setForm({ ...form, breathing_difficulty: v })}
                  labels={['Easy', 'Light', 'Mod', 'Hard', 'Max'].map(l => l.toUpperCase())}
                />
              </div>
            </div>
          )}

           {step === 2 && (
            <div className="space-y-6 flex-1 pb-4">
              <div className="space-y-4">
                 <p className="text-[10px] items-center gap-2 uppercase font-black tracking-widest text-gray-400 block mb-3 flex"><span className="text-red-500">⚠️</span> Any pain or injury?</p>
                <div className="flex gap-3">
                  {(['No', 'Yes'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setForm({ ...form, has_pain: opt === 'Yes' })}
                      className={cn(
                        'flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border',
                        form.has_pain === (opt === 'Yes')
                          ? (opt === 'Yes' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]')
                          : 'bg-black/50 text-gray-500 border-white/10 hover:border-white/30'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {form.has_pain && (
                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 space-y-6 shadow-inner backdrop-blur-sm relative overflow-hidden mt-6">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[30px] rounded-full pointer-events-none" />
                  
                  <div className="flex items-center gap-3 relative z-10 border-b border-red-500/20 pb-4">
                    <AlertTriangle className="h-5 w-5 text-red-500 drop-shadow-[0_0_8px_currentColor] flex-shrink-0" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Alert will be reported to coach.</p>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <p className="text-[10px] uppercase font-black tracking-widest text-red-400">Body Part</p>
                    <div className="flex flex-wrap gap-2">
                      {BODY_PARTS.map(part => (
                        <button key={part} type="button"
                          onClick={() => setForm({ ...form, pain_body_part: part })}
                           className={cn(
                            'px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-transparent',
                            form.pain_body_part === part
                              ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                              : 'bg-black/60 text-red-200 border-red-500/20 hover:bg-red-500/20'
                          )}
                        >
                          {part}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 relative z-10">
                     <p className="text-[10px] uppercase font-black tracking-widest text-red-400">Pain Severity</p>
                    <TapRating min={1} max={5} value={form.pain_level}
                      onChange={v => setForm({ ...form, pain_level: v })}
                      labels={['Mild', 'Minor', 'Mod', 'Sig', 'Crit'].map(l => l.toUpperCase())}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

           {step === 3 && (
            <div className="space-y-8 flex-1 pb-4">
              <div className="space-y-4">
                 <p className="text-[10px] items-center gap-2 uppercase font-black tracking-widest text-gray-400 block mb-3 flex"><span className="text-blue-500">🎯</span> Variance from Target Splits?</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: 'yes', label: 'In Spec', emoji: '🎯', color: 'blue' },
                    { value: 'close', label: 'Marginal', emoji: '↗️', color: 'teal' },
                    { value: 'no', label: 'Deviated', emoji: '📉', color: 'orange' },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, hit_target_splits: opt.value })}
                       className={cn(
                        'py-5 px-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-2',
                        form.hit_target_splits === opt.value
                           ? `bg-${opt.color}-500/20 text-${opt.color}-400 border-${opt.color}-500 shadow-[0_0_15px_rgba(var(--${opt.color}-rgb),0.3)_inset]`
                          : 'bg-black/40 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'
                      )}
                    >
                       <div className={cn(
                        "text-2xl drop-shadow-md",
                        form.hit_target_splits !== opt.value && "grayscale opacity-50"
                      )}>{opt.emoji}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase font-black tracking-widest text-green-500 block mb-3">What went well? (Optional)</p>
                <input
                   className="w-full bg-black/60 border border-green-500/20 text-white placeholder:text-gray-600 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-green-500 focus:bg-white/5 transition-all shadow-inner"
                  placeholder="e.g. Felt powerful on the drive..."
                  value={form.felt_good}
                  onChange={e => setForm({ ...form, felt_good: e.target.value })}
                />
              </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase font-black tracking-widest text-red-500/70 block mb-3">What felt off? (Optional)</p>
                 <input
                   className="w-full bg-black/60 border border-red-500/20 text-white placeholder:text-gray-600 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/5 transition-all shadow-inner"
                  placeholder="e.g. Catch felt slow..."
                  value={form.felt_off}
                  onChange={e => setForm({ ...form, felt_off: e.target.value })}
                />
              </div>
            </div>
          )}

           {step === 4 && (
            <div className="space-y-8 flex-1 pb-4">
              <div className="space-y-4">
                 <p className="text-[10px] items-center gap-2 uppercase font-black tracking-widest text-gray-400 block mb-2 flex"><span className="text-purple-500">🔋</span> Current Recovery Status</p>
                <TapRating min={1} max={5} value={form.recovery_status}
                  onChange={v => setForm({ ...form, recovery_status: v })}
                  labels={['Depleted', 'Low', 'Nominal', 'Good', 'Peak'].map(l => l.toUpperCase())}
                />
              </div>
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                 <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">T+24H Readiness Prediction</p>
                <div className="flex gap-3">
                  {([
                    { value: 'yes', label: 'Go', emoji: '🟢', color: 'green' },
                    { value: 'maybe', label: 'Marginal', emoji: '🟡', color: 'yellow' },
                    { value: 'no', label: 'No Go', emoji: '🔴', color: 'red' },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, ready_tomorrow: opt.value })}
                       className={cn(
                        'flex-1 py-4 px-2 rounded-xl border transition-all text-center flex flex-col items-center gap-2',
                        form.ready_tomorrow === opt.value
                           ? `bg-${opt.color}-500/20 text-${opt.color}-400 border-${opt.color}-500 shadow-[0_0_15px_rgba(var(--${opt.color}-rgb),0.3)_inset]`
                          : 'bg-black/40 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'
                      )}
                    >
                       <div className="text-[8px] uppercase font-black tracking-widest">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

               <div className="flex items-center justify-between py-5 px-5 bg-white/5 rounded-2xl border border-white/10 shadow-inner mt-4">
                 <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Academic Load Tonight?</p>
                <button type="button"
                  onClick={() => setForm({ ...form, studying_tonight: !form.studying_tonight })}
                   className={cn(
                    'w-14 h-7 rounded-full transition-colors flex items-center shadow-inner border border-white/10',
                    form.studying_tonight ? 'bg-white' : 'bg-black/60'
                  )}
                >
                   <div className={cn(
                    'w-5 h-5 rounded-full shadow-md transition-transform mx-1',
                    form.studying_tonight ? 'bg-black translate-x-7' : 'bg-gray-500 translate-x-0'
                  )} />
                </button>
              </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                 <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">Notes for Coach (Optional)</p>
                 <textarea
                  className="w-full bg-black/60 border border-white/10 text-white placeholder:text-gray-600 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white focus:bg-white/5 transition-all shadow-inner resize-none min-h-[80px]"
                  rows={2}
                  placeholder="Additional context..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 5 && (
             <div className="flex flex-col items-center justify-center py-6 flex-1 relative">
               <div className="absolute inset-0 bg-green-500/20 blur-[50px] rounded-full z-0 pointer-events-none" />
               <div className="bg-green-950/40 border border-green-500/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)_inset] relative z-10">
                <CheckCircle2 className="h-10 w-10 text-green-400 drop-shadow-[0_0_10px_currentColor]" />
              </div>
              
               <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)] relative z-10">Check-in Complete</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 relative z-10 text-center max-w-[200px]">
                Post-session data shared with coach.
              </p>

              {form.has_pain && (
                <div className="relative z-10 w-full max-w-[300px] bg-red-950/20 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4 text-left shadow-inner">
                  <div className="bg-red-500/20 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-red-500 drop-shadow-[0_0_5px_currentColor]" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-red-400 mb-0.5">Alert Flagged</p>
                    <p className="text-[10px] text-red-200 uppercase font-bold tracking-widest">Pain report sent.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 justify-end mt-8 relative z-10">
            {step > 0 && step < steps.length - 1 && (
               <button 
                 className="flex-1 bg-transparent border border-white/20 text-white hover:bg-white/10 uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all"
                 onClick={back}
               >
                 Back
               </button>
            )}
            {step < steps.length - 2 && (
               <button 
                  className="flex-[2] bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  onClick={next}
                >
                  Continue
                </button>
            )}
            {step === steps.length - 2 && (
               <button 
                  className={cn(
                    "flex-[2] uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all flex justify-center items-center gap-2",
                    submitLog.isPending ? "bg-white/50 text-black cursor-not-allowed" : "bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  )}
                  onClick={handleSubmit} 
                  disabled={submitLog.isPending}
               >
                 {submitLog.isPending ? 'Syncing...' : 'Submit Session'}
               </button>
            )}
            {step === steps.length - 1 && (
               <button 
                  className="w-full bg-green-500 text-white uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:bg-green-400"
                  onClick={onDone}
                >
                  Acknowledge
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
