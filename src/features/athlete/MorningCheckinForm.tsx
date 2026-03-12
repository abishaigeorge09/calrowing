import { useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TapRating, Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { useSubmitWellnessLog } from '@/hooks/mutations'
import type { WellnessLog, Session } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onDone: () => void
  coachId?: string
  recentLogs?: WellnessLog[]
  tomorrowSession?: Session | null
}

const BODY_PARTS = ['Head', 'Neck', 'Shoulder (L)', 'Shoulder (R)', 'Upper Back', 'Lower Back', 'Core', 'Hip', 'Quad (L)', 'Quad (R)', 'Hamstring', 'Knee', 'Calf', 'Foot']

export default function MorningCheckinForm({ onClose, onDone, coachId, recentLogs = [], tomorrowSession = null }: Props) {
  const [step, setStep] = useState(0)
  const submitLog = useSubmitWellnessLog()
  const [form, setForm] = useState({
    sleep_hours: 7,
    sleep_quality: 3,
    energy: 3,
    has_soreness: false,
    soreness_body_part: '',
    soreness_level: 3,
    stress: 3,
    motivation: 3,
    classes_today: 2,
    assignments_due: false,
    exam_this_week: false,
    note: '',
  })

  const steps = [
    { title: 'Sleep', emoji: '😴' },
    { title: 'How You Feel', emoji: '⚡' },
    { title: 'Soreness', emoji: '💪' },
    { title: 'Academic Load', emoji: '📚' },
    { title: 'Done!', emoji: '✅' },
  ]

  const handleSubmit = async () => {
    await submitLog.mutateAsync({
      logType: 'morning',
      coachId,
      recentLogs,
      tomorrowSession,
      data: {
        sleep_hours: form.sleep_hours,
        sleep_quality: form.sleep_quality,
        energy: form.energy,
        has_soreness: form.has_soreness,
        soreness_body_part: form.has_soreness ? form.soreness_body_part : undefined,
        soreness_level: form.has_soreness ? form.soreness_level : undefined,
        stress: form.stress,
        motivation: form.motivation,
        classes_today: form.classes_today,
        assignments_due: form.assignments_due,
        exam_this_week: form.exam_this_week,
        note_to_coach: form.note || undefined,
      },
    })
    setStep(4)
  }

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const energyLabels = ['', 'Very Low', 'Low', 'OK', 'Good', 'Great']
  const qualityLabels = ['', 'Poor', 'Fair', 'OK', 'Good', 'Excellent']
  const stressLabels = ['', 'None', 'Low', 'Moderate', 'High', 'Very High']
  const motivationLabels = ['', 'Dread', 'Low', 'OK', 'Motivated', 'Pumped']

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end">
      <div className="bg-black/95 border-t border-white/10 w-full rounded-t-[2.5rem] px-6 pt-8 pb-10 safe-bottom max-h-[92dvh] overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/5 blur-[50px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Boot Sequence</p>
            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{steps[step].emoji}</span> {steps[step].title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 text-white transition-colors shadow-inner">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 relative z-10 w-full max-w-sm mx-auto">
          {steps.map((_, i) => (
            <div key={i} className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              i <= step ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/10'
            )} />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-sm mx-auto">
          {step === 0 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Power Cycle (Sleep Hours)</Label>
                <div className="text-center bg-black/40 border border-white/5 rounded-3xl py-6 shadow-inner">
                  <span className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{form.sleep_hours}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-2">hrs</span>
                </div>
                <Slider min={3} max={12} step={0.5} value={form.sleep_hours} colorClass="accent-white"
                  onChange={(v) => setForm({ ...form, sleep_hours: v })} showValue={false} />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span>3h</span><span>6h</span><span>8h</span><span>12h</span>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Power Quality</Label>
                <TapRating min={1} max={5} value={form.sleep_quality}
                  onChange={(v) => setForm({ ...form, sleep_quality: v })}
                  labels={qualityLabels.slice(1).map(l => l.toUpperCase())}
                  colorClass="bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Active Energy Level</Label>
                <TapRating min={1} max={5} value={form.energy}
                  onChange={(v) => setForm({ ...form, energy: v })}
                  labels={energyLabels.slice(1).map(l => l.toUpperCase())}
                  colorClass="bg-yellow-400 text-yellow-950 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                 <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">System Stress</Label>
                <TapRating min={1} max={5} value={form.stress}
                   onChange={(v) => setForm({ ...form, stress: v })}
                  labels={stressLabels.slice(1).map(l => l.toUpperCase())}
                  colorClass="bg-purple-400 text-purple-950 shadow-[0_0_10px_rgba(192,132,252,0.5)]" />
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Operational Motivation</Label>
                <TapRating min={1} max={5} value={form.motivation}
                  onChange={(v) => setForm({ ...form, motivation: v })}
                  labels={motivationLabels.slice(1).map(l => l.toUpperCase())}
                  colorClass="bg-blue-400 text-blue-950 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                 <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Hardware Soreness/Pain?</Label>
                <div className="flex gap-3">
                  {(['No', 'Yes'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setForm({ ...form, has_soreness: opt === 'Yes' })}
                      className={cn(
                        'flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border',
                        form.has_soreness === (opt === 'Yes')
                          ? (opt === 'Yes' ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]')
                          : 'bg-black/50 text-gray-500 border-white/10 hover:border-white/30'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {form.has_soreness && (
                <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-5 space-y-5 shadow-inner backdrop-blur-sm">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-orange-400">Specify Component</Label>
                    <div className="flex flex-wrap gap-2">
                      {BODY_PARTS.map(part => (
                        <button key={part} type="button"
                          onClick={() => setForm({ ...form, soreness_body_part: part })}
                          className={cn(
                            'px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-transparent',
                            form.soreness_body_part === part
                              ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                              : 'bg-black/60 text-orange-200 border-orange-500/20 hover:bg-orange-500/20'
                          )}
                        >
                          {part}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-orange-400">Soreness Level</Label>
                    <TapRating min={1} max={5} value={form.soreness_level}
                      onChange={(v) => setForm({ ...form, soreness_level: v })}
                      labels={['Mild', 'Minor', 'Moderate', 'Severe', 'Critical'].map(l => l.toUpperCase())}
                      colorClass="bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-inner">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">Academic Modules (Classes)</Label>
                <TapRating min={0} max={5} value={form.classes_today}
                   onChange={(v) => setForm({ ...form, classes_today: v })}
                  labels={['0', '1', '2', '3', '4', '5+']}
                  colorClass="bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              </div>
              <div className="flex items-center justify-between py-4 px-5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                 <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Assignments Due?</Label>
                <button type="button"
                  onClick={() => setForm({ ...form, assignments_due: !form.assignments_due })}
                   className={cn(
                    'w-14 h-7 rounded-full transition-colors flex items-center shadow-inner border border-white/10',
                    form.assignments_due ? 'bg-white' : 'bg-black/60'
                  )}
                >
                   <div className={cn(
                    'w-5 h-5 rounded-full shadow-md transition-transform mx-1',
                    form.assignments_due ? 'bg-black translate-x-7' : 'bg-gray-500 translate-x-0'
                  )} />
                </button>
              </div>
              <div className="flex items-center justify-between py-4 px-5 bg-yellow-950/20 rounded-2xl border border-yellow-500/20 shadow-inner">
                <Label className="text-[10px] uppercase font-black tracking-widest text-yellow-500">Exams this week?</Label>
                <button type="button"
                  onClick={() => setForm({ ...form, exam_this_week: !form.exam_this_week })}
                  className={cn(
                    'w-14 h-7 rounded-full transition-colors flex items-center shadow-inner border',
                    form.exam_this_week ? 'bg-yellow-500 border-yellow-400' : 'bg-black/60 border-white/10'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full shadow-md transition-transform mx-1',
                    form.exam_this_week ? 'bg-black translate-x-7' : 'bg-yellow-500 translate-x-0'
                  )} />
                </button>
              </div>
              <div className="space-y-3 pt-2">
                 <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Notes for Director (Opt)</Label>
                <textarea
                  className="w-full bg-black/60 border border-white/10 text-white placeholder:text-gray-600 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white focus:bg-white/5 transition-all shadow-inner resize-none min-h-[80px]"
                  placeholder="Additional context..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-500/20 blur-[30px] rounded-full" />
                <div className="bg-green-950/40 border border-green-500/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(74,222,128,0.3)_inset] relative z-10">
                  <CheckCircle2 className="h-10 w-10 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </div>
              </div>
              
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Boot Complete</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-6">Data synchronized with array director</p>
              
               <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 flex items-center justify-between text-left shadow-inner border border-white/10 flex-wrap gap-y-3">
                 <div className="w-1/2">
                   <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">Power</p>
                   <p className="font-black text-white tracking-widest text-sm">{form.sleep_hours}H <span className="text-gray-500 text-xs px-1">|</span> Q {form.sleep_quality}</p>
                 </div>
                 <div className="w-1/2">
                   <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">Energy Lvl</p>
                   <p className="font-black text-white tracking-widest text-sm">{form.energy}/5</p>
                 </div>
                 <div className="w-1/2">
                   <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">Stress Lvl</p>
                   <p className="font-black text-white tracking-widest text-sm">{form.stress}/5</p>
                 </div>
                 {form.has_soreness && (
                    <div className="w-1/2">
                       <p className="text-[9px] uppercase font-black tracking-widest text-orange-400 mb-1">Dmg Flag</p>
                       <p className="font-black text-orange-300 tracking-widest text-[11px] truncate">{form.soreness_body_part} ({form.soreness_level})</p>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-10">
            {step > 0 && step < 4 && (
              <button 
                className="flex-1 bg-transparent border border-white/20 text-white hover:bg-white/10 uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all"
                onClick={back}
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button 
                className="flex-[2] bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                onClick={next}
              >
                Continue
              </button>
            )}
            {step === 3 && (
              <button 
                 className="flex-[2] bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] flex justify-center items-center gap-2 disabled:opacity-50"
                onClick={handleSubmit} 
                disabled={submitLog.isPending}
              >
                {submitLog.isPending ? 'Syncing...' : 'Commit Sequence'}
              </button>
            )}
            {step === 4 && (
              <button 
                className="w-full bg-green-500 text-white uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:bg-green-400"
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
