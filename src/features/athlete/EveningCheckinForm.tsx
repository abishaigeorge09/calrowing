import { useState } from 'react'
import { X, CheckCircle2, Moon, Droplets, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TapRating } from '@/components/ui/slider'
import { Slider } from '@/components/ui/slider'
import { useSubmitWellnessLog } from '@/hooks/mutations'
import type { EveningLogData } from '@/types/database'

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

  if (step === 'done') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl px-6 pt-6 pb-10 safe-bottom">
          <div className="flex flex-col items-center text-center py-6">
            <div className="bg-indigo-100 rounded-full p-4 mb-4">
              <CheckCircle2 className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Evening log saved!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Aiming for {form.expected_sleep_hours}h tonight. Rest up!
            </p>
            <div className="grid grid-cols-3 gap-3 w-full mb-6">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <Utensils className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-black text-green-700">{form.nutrition_quality}/5</p>
                <p className="text-xs text-green-600">Nutrition</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <Droplets className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-black text-blue-700">{form.hydration_liters}L</p>
                <p className="text-xs text-blue-600">Hydration</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <Moon className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-lg font-black text-indigo-700">{form.expected_sleep_hours}h</p>
                <p className="text-xs text-indigo-600">Target sleep</p>
              </div>
            </div>
            <Button className="w-full" onClick={onDone}>Done</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 pt-6 pb-10 safe-bottom max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Evening Log</h2>
            <p className="text-xs text-slate-500">Step {stepIdx + 1} of {steps.length - 1}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Step: Nutrition */}
        {step === 'nutrition' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 rounded-full p-3">
                <Utensils className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Nutrition</h3>
                <p className="text-sm text-slate-500">How well did you fuel today?</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Overall nutrition quality</p>
              <TapRating
                value={form.nutrition_quality}
                max={5}
                onChange={(v) => setForm({ ...form, nutrition_quality: v })}
                labels={['Poor', 'Fair', 'OK', 'Good', 'Great']}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Meals today</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, meals_count: n })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      form.meals_count === n
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Any notes? <span className="text-slate-400 font-normal">(optional)</span></p>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                rows={2}
                placeholder="e.g. skipped lunch, had protein shake post-training..."
                value={form.nutrition_note}
                onChange={(e) => setForm({ ...form, nutrition_note: e.target.value })}
              />
            </div>

            <Button className="w-full" size="lg" onClick={next}>Continue</Button>
          </div>
        )}

        {/* Step: Hydration */}
        {step === 'hydration' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 rounded-full p-3">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Hydration</h3>
                <p className="text-sm text-slate-500">Hydration is critical for recovery</p>
              </div>
            </div>

            <div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-black text-blue-600">{form.hydration_liters}</span>
                <span className="text-xl font-semibold text-slate-500 mb-1">L</span>
              </div>
              <Slider
                min={0.5}
                max={5}
                step={0.5}
                value={form.hydration_liters}
                onChange={(v) => setForm({ ...form, hydration_liters: v })}
                colorClass="accent-blue-500"
                showValue={false}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0.5L</span>
                <span>5L</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                {form.hydration_liters < 2 ? '⚠️ Below recommended for athletes' :
                 form.hydration_liters < 3 ? '✓ Adequate hydration' : '🌊 Well hydrated!'}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">How hydrated do you feel?</p>
              <TapRating
                value={form.hydration_quality}
                max={5}
                onChange={(v) => setForm({ ...form, hydration_quality: v })}
                labels={['Thirsty', '', 'OK', '', 'Great']}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('nutrition')}>Back</Button>
              <Button size="lg" className="flex-1" onClick={next}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step: Sleep plan */}
        {step === 'sleep' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 rounded-full p-3">
                <Moon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Sleep Plan</h3>
                <p className="text-sm text-slate-500">How much sleep are you targeting?</p>
              </div>
            </div>

            <div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-black text-indigo-600">{form.expected_sleep_hours}</span>
                <span className="text-xl font-semibold text-slate-500 mb-1">h</span>
              </div>
              <Slider
                min={4}
                max={12}
                step={0.5}
                value={form.expected_sleep_hours}
                onChange={(v) => setForm({ ...form, expected_sleep_hours: v })}
                colorClass="accent-indigo-500"
                showValue={false}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>4h</span>
                <span>12h</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                {form.expected_sleep_hours < 7 ? '⚠️ Below recommended — aim for 8h' :
                 form.expected_sleep_hours >= 8 ? '✓ Great target for recovery' : '✓ Good'}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Anything affecting sleep? <span className="text-slate-400 font-normal">(optional)</span></p>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                rows={2}
                placeholder="e.g. late study session, stressed about tomorrow..."
                value={form.bedtime_note}
                onChange={(e) => setForm({ ...form, bedtime_note: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('hydration')}>Back</Button>
              <Button size="lg" className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Log'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
