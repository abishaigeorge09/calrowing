import { useState } from 'react'
import { X, CheckCircle2, Moon, Droplets, Utensils, Hexagon } from 'lucide-react'
import { TapRating, Slider } from '@/components/ui/slider'
import { useSubmitWellnessLog } from '@/hooks/mutations'
import type { EveningLogData } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onDone: () => void
  coachId?: string
}

type Step = 'nutrition' | 'hydration' | 'sleep' | 'done'

export default function EveningCheckinForm({ onClose, onDone, coachId }: Props) {
  const [step, setStep] = useState<Step>('nutrition')
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    nutrition_quality: 3,
    meals_count: 3,
    nutrition_note: '',
    hydration_liters: 2.5,
    hydration_quality: 3,
    expected_sleep_hours: 8,
    bedtime_note: '',
  })

  const submitLog = useSubmitWellnessLog()

  const steps: Step[] = ['nutrition', 'hydration', 'sleep', 'done']
  const stepIdx = steps.indexOf(step)
  const progress = ((stepIdx) / (steps.length - 1)) * 100

  const next = () => {
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) setStep(steps[idx + 1])
  }

  // Save log before showing done screen
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await submitLog.mutateAsync({
        logType: 'evening',
        coachId,
        data: {
          energy: form.hydration_quality,
          nutrition_quality: form.nutrition_quality,
          hydration: form.hydration_liters,
          expected_sleep_hours: form.expected_sleep_hours,
          day_rating: 3,
        } as EveningLogData,
      })
      setStep('done')
    } catch (err) {
      console.error('Failed to save evening log:', err)
      setStep('done') // advance even on error so user isn't stuck
    } finally {
      setIsSaving(false)
    }
  }

  const iconForStep = (idx: number) => {
    switch (idx) {
      case 0: return <Utensils className="h-4 w-4 text-green-400 drop-shadow-[0_0_5px_currentColor]" />
      case 1: return <Droplets className="h-4 w-4 text-blue-400 drop-shadow-[0_0_5px_currentColor]" />
      case 2: return <Moon className="h-4 w-4 text-indigo-400 drop-shadow-[0_0_5px_currentColor]" />
      default: return <Hexagon className="h-4 w-4 text-gray-400 drop-shadow-[0_0_5px_currentColor]" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end">
      <div className="bg-black/95 border-t border-white/10 w-full rounded-t-[2.5rem] px-6 pt-8 pb-10 safe-bottom max-h-[92dvh] overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative">
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10 w-full max-w-sm mx-auto">
          <div>
             <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Regen Log</p>
             <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              {step !== 'done' ? (
                <>
                  <span className="bg-white/10 p-2 rounded-xl border border-white/20 shadow-inner">
                    {iconForStep(stepIdx)}
                  </span>
                  {steps[stepIdx].charAt(0).toUpperCase() + steps[stepIdx].slice(1)}
                </>
              ) : 'Sequence Complete'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 text-white transition-colors shadow-inner">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm mx-auto bg-white/10 rounded-full h-1.5 mb-8 relative z-10 overflow-hidden shadow-inner border border-white/5">
          <div className="bg-indigo-500 h-full rounded-full transition-all shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ width: `${progress}%` }} />
        </div>

        <div className="relative z-10 w-full max-w-sm mx-auto min-h-[50vh] flex flex-col pt-4">
          {/* Step: Nutrition */}
          {step === 'nutrition' && (
            <div className="space-y-8 flex-1">
              <div>
                <p className="text-[10px] items-center gap-2 uppercase font-black tracking-widest text-gray-400 block mb-4 flex"><Utensils className="w-3.5 h-3.5"/>Fuel Quality</p>
                <TapRating
                  value={form.nutrition_quality}
                  max={5}
                  onChange={(v) => setForm({ ...form, nutrition_quality: v })}
                  labels={['Poor', 'Fair', 'OK', 'Good', 'Peak'].map(l => l.toUpperCase())}
                  colorClass="bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                />
              </div>

               <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">Refueling Cycles (Meals)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setForm({ ...form, meals_count: n })}
                       className={cn(
                        'flex-1 py-3 rounded-xl text-sm font-black transition-all border',
                        form.meals_count === n
                           ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105 z-10'
                           : 'bg-black/50 text-gray-400 border-white/10 hover:border-white/30 hover:bg-white/5'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                 <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">Nutrition Notes (Opt)</p>
                <textarea
                  className="w-full bg-black/60 border border-white/10 text-white placeholder:text-gray-600 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white focus:bg-white/5 transition-all shadow-inner resize-none min-h-[80px]"
                  rows={2}
                  placeholder="e.g. Skipped cycle..."
                  value={form.nutrition_note}
                  onChange={(e) => setForm({ ...form, nutrition_note: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step: Hydration */}
          {step === 'hydration' && (
            <div className="space-y-8 flex-1">
              <div>
                 <p className="text-[10px] items-center gap-2 uppercase font-black tracking-widest text-gray-400 block mb-4 flex"><Droplets className="w-3.5 h-3.5"/>Volume Intake</p>
                <div className="flex items-end justify-center gap-2 mb-6 bg-black/40 border border-white/5 rounded-3xl py-6 shadow-inner">
                  <span className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{form.hydration_liters}</span>
                   <span className="text-xl font-black uppercase tracking-widest text-gray-500 ml-1 mb-2">L</span>
                </div>
                <Slider
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={form.hydration_liters}
                  onChange={(v) => setForm({ ...form, hydration_liters: v })}
                  colorClass="accent-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                  showValue={false}
                />
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-gray-500 mt-2">
                  <span>0.5L</span>
                  <span>5L</span>
                </div>
                <p className="text-[10px] tracking-widest font-bold uppercase text-gray-500 mt-4 text-center">
                  {form.hydration_liters < 2 ? '⚠️ Suboptimal level' :
                   form.hydration_liters < 3 ? '✓ Nominal flow' : '🌊 High volume'}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-4">Hydration Sensation</p>
                <TapRating
                  value={form.hydration_quality}
                  max={5}
                  onChange={(v) => setForm({ ...form, hydration_quality: v })}
                  labels={['Dry', '', 'Nominal', '', 'Fluid'].map(l => l.toUpperCase())}
                  colorClass="bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                />
              </div>
            </div>
          )}

          {/* Step: Sleep plan */}
          {step === 'sleep' && (
            <div className="space-y-8 flex-1">
              <div>
                 <p className="text-[10px] items-center gap-2 uppercase font-black tracking-widest text-gray-400 block mb-4 flex"><Moon className="w-3.5 h-3.5"/>Power Target</p>
                <div className="flex items-end justify-center gap-2 mb-6 bg-black/40 border border-white/5 rounded-3xl py-6 shadow-inner">
                  <span className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{form.expected_sleep_hours}</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1 mb-3">hrs</span>
                </div>
                <Slider
                  min={4}
                  max={12}
                  step={0.5}
                  value={form.expected_sleep_hours}
                  onChange={(v) => setForm({ ...form, expected_sleep_hours: v })}
                  colorClass="accent-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                  showValue={false}
                />
                <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-gray-500 mt-2">
                  <span>4H</span>
                  <span>12H</span>
                </div>
                <p className="text-[10px] tracking-widest font-bold uppercase text-gray-500 mt-4 text-center">
                  {form.expected_sleep_hours < 7 ? '⚠️ Below nominal capacity' :
                   form.expected_sleep_hours >= 8 ? '✓ Optimal regen sequence' : '✓ Acceptable'}
                </p>
              </div>

               <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-3">Shutdown Context (Opt)</p>
                <textarea
                   className="w-full bg-black/60 border border-white/10 text-white placeholder:text-gray-600 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white focus:bg-white/5 transition-all shadow-inner resize-none min-h-[80px]"
                  rows={2}
                  placeholder="e.g. Extended cycle processing..."
                  value={form.bedtime_note}
                  onChange={(e) => setForm({ ...form, bedtime_note: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-6 flex-1 relative">
               <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full z-0" />
               <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)_inset] relative z-10">
                <CheckCircle2 className="h-10 w-10 text-indigo-400 drop-shadow-[0_0_10px_currentColor]" />
              </div>
              
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)] relative z-10">Sync Established</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 relative z-10 text-center max-w-[200px]">
                Regen protocol parameterized for {form.expected_sleep_hours}H.
              </p>
              
               <div className="grid grid-cols-3 gap-3 w-full max-w-[300px] mb-8 relative z-10">
                <div className="bg-green-950/20 border border-green-500/30 rounded-2xl p-4 text-center shadow-inner">
                  <Utensils className="h-4 w-4 text-green-400 mx-auto mb-2 drop-shadow-[0_0_5px_currentColor]" />
                  <p className="text-xl font-black text-white">{form.nutrition_quality}</p>
                   <p className="text-[8px] uppercase tracking-widest font-black text-green-500/70 mt-1">Fuel</p>
                </div>
                 <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-4 text-center shadow-inner">
                  <Droplets className="h-4 w-4 text-blue-400 mx-auto mb-2 drop-shadow-[0_0_5px_currentColor]" />
                  <p className="text-xl font-black text-white tracking-widest">{form.hydration_liters}L</p>
                  <p className="text-[8px] uppercase tracking-widest font-black text-blue-500/70 mt-1">Vol</p>
                </div>
                 <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 text-center shadow-inner">
                  <Moon className="h-4 w-4 text-indigo-400 mx-auto mb-2 drop-shadow-[0_0_5px_currentColor]" />
                  <p className="text-xl font-black text-white tracking-widest">{form.expected_sleep_hours}H</p>
                  <p className="text-[8px] uppercase tracking-widest font-black text-indigo-500/70 mt-1">Pwr / Tgt</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
           <div className="flex gap-3 justify-end mt-4">
             {step !== 'done' ? (
                <>
                  {step !== 'nutrition' && (
                    <button 
                      className="flex-1 bg-transparent border border-white/20 text-white hover:bg-white/10 uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all"
                      onClick={() => setStep(step === 'sleep' ? 'hydration' : 'nutrition')}
                    >
                      Back
                    </button>
                  )}
                  {step !== 'sleep' && (
                     <button 
                      className="flex-[2] bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      onClick={next}
                    >
                      Continue
                    </button>
                  )}
                  {step === 'sleep' && (
                     <button 
                       className={cn(
                        "flex-[2] uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all flex justify-center items-center",
                        isSaving ? "bg-white/50 text-black cursor-not-allowed" : "bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      )}
                      onClick={handleSave} 
                      disabled={isSaving}
                    >
                      {isSaving ? 'Synchronizing...' : 'Transmit Sequence'}
                    </button>
                  )}
                </>
             ) : (
                <button 
                   className="w-full bg-indigo-500 text-white uppercase tracking-widest text-xs font-bold rounded-xl py-4 transition-all shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:bg-indigo-400 relative z-10"
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
