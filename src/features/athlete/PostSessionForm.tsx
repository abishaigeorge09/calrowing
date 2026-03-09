import { useState } from 'react'
import { CheckCircle2, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TapRating, Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import type { Session } from '@/types/database'

interface Props {
  session: Session
  onClose: () => void
  onDone: () => void
}

const BODY_PARTS = ['Head', 'Neck', 'Shoulder (L)', 'Shoulder (R)', 'Upper Back', 'Lower Back', 'Core', 'Hip', 'Quad', 'Hamstring', 'Knee', 'Calf']

export default function PostSessionForm({ session, onClose, onDone }: Props) {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
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
    { title: 'Session Completion', emoji: '🏁' },
    { title: 'Effort & Fatigue', emoji: '💪' },
    { title: 'Pain Check', emoji: '🩺' },
    { title: 'Performance', emoji: '🎯' },
    { title: 'Recovery', emoji: '🔋' },
    { title: 'Done!', emoji: '✅' },
  ]

  const next = () => {
    if (step === steps.length - 2) {
      setSubmitted(true)
    }
    setStep(s => Math.min(s + 1, steps.length - 1))
  }
  const back = () => setStep(s => Math.max(s - 1, 0))

  const rpeColors = [
    '', '#22c55e', '#4ade80', '#86efac', '#fde047', '#fbbf24',
    '#fb923c', '#f97316', '#ef4444', '#dc2626', '#991b1b',
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end">
      <div className="bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Post-Session Check-in</p>
            <h2 className="text-xl font-bold">{steps[step].emoji} {steps[step].title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>How did it go?</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'full', label: 'Completed', emoji: '✅' },
                  { value: 'partial', label: 'Partial', emoji: '⚠️' },
                  { value: 'dnf', label: 'Did Not Complete', emoji: '❌' },
                ] as const).map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm({ ...form, completion: opt.value })}
                    className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${
                      form.completion === opt.value
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.emoji}</div>
                    <div className="text-xs font-semibold">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
            {(form.completion === 'partial' || form.completion === 'dnf') && (
              <div className="space-y-2">
                <Label>Reason</Label>
                <div className="flex flex-wrap gap-2">
                  {['Injury', 'Fatigue', 'Time', 'Illness', 'Other'].map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm({ ...form, dnf_reason: r })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 ${
                        form.dnf_reason === r ? 'bg-red-500 text-white border-red-500' : 'bg-white border-slate-200'
                      }`}
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
          <div className="space-y-6">
            {/* RPE */}
            <div className="space-y-3">
              <Label>RPE (Rate of Perceived Exertion)</Label>
              <div className="text-center mb-2">
                <span className="text-6xl font-black" style={{ color: rpeColors[form.rpe] }}>{form.rpe}</span>
                <span className="text-slate-500">/10</span>
                <p className="text-sm text-slate-500 mt-1">
                  {form.rpe <= 3 ? 'Very easy' : form.rpe <= 5 ? 'Moderate' : form.rpe <= 7 ? 'Hard' : form.rpe <= 9 ? 'Very hard' : 'Max effort'}
                </p>
              </div>
              <Slider min={1} max={10} value={form.rpe} onChange={v => setForm({ ...form, rpe: v })} showValue={false} />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1 (Easy)</span><span>5 (Moderate)</span><span>10 (Max)</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Legs fatigue</Label>
              <TapRating min={1} max={5} value={form.legs_fatigue}
                onChange={v => setForm({ ...form, legs_fatigue: v })}
                labels={['Fresh', 'Light', 'Normal', 'Heavy', 'Dead']} />
            </div>
            <div className="space-y-3">
              <Label>Back & Core fatigue</Label>
              <TapRating min={1} max={5} value={form.back_core_fatigue}
                onChange={v => setForm({ ...form, back_core_fatigue: v })}
                labels={['Fresh', 'Light', 'Normal', 'Heavy', 'Spent']} />
            </div>
            <div className="space-y-3">
              <Label>Breathing difficulty</Label>
              <TapRating min={1} max={5} value={form.breathing_difficulty}
                onChange={v => setForm({ ...form, breathing_difficulty: v })}
                labels={['Easy', 'Light', 'Normal', 'Hard', 'Max']} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Any pain during the session?</Label>
              <div className="flex gap-3">
                {(['No', 'Yes'] as const).map(opt => (
                  <button key={opt} type="button"
                    onClick={() => setForm({ ...form, has_pain: opt === 'Yes' })}
                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                      form.has_pain === (opt === 'Yes')
                        ? opt === 'Yes' ? 'bg-red-500 text-white border-red-500' : 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {form.has_pain && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">Your coach will be notified immediately.</p>
                </div>
                <div className="space-y-2">
                  <Label>Where?</Label>
                  <div className="flex flex-wrap gap-2">
                    {BODY_PARTS.map(part => (
                      <button key={part} type="button"
                        onClick={() => setForm({ ...form, pain_body_part: part })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 ${
                          form.pain_body_part === part ? 'bg-red-500 text-white border-red-500' : 'bg-white border-slate-200'
                        }`}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Pain level</Label>
                  <TapRating min={1} max={5} value={form.pain_level}
                    onChange={v => setForm({ ...form, pain_level: v })}
                    labels={['Mild', 'Minor', 'Moderate', 'Significant', 'Severe']} />
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Did you hit target splits?</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'yes', label: 'Yes', emoji: '🎯' },
                  { value: 'close', label: 'Close', emoji: '↗️' },
                  { value: 'no', label: 'No', emoji: '📉' },
                ] as const).map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm({ ...form, hit_target_splits: opt.value })}
                    className={`py-3 rounded-xl border-2 text-center transition-all ${
                      form.hit_target_splits === opt.value
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.emoji}</div>
                    <div className="text-sm font-semibold">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>What felt good? (optional)</Label>
              <input
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] transition-colors"
                placeholder="My catch timing was solid…"
                value={form.felt_good}
                onChange={e => setForm({ ...form, felt_good: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>What felt off? (optional)</Label>
              <input
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] transition-colors"
                placeholder="Legs felt heavy in the 3rd piece…"
                value={form.felt_off}
                onChange={e => setForm({ ...form, felt_off: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Recovery status right now</Label>
              <TapRating min={1} max={5} value={form.recovery_status}
                onChange={v => setForm({ ...form, recovery_status: v })}
                labels={['Spent', 'Tired', 'OK', 'Good', 'Fresh']} />
            </div>
            <div className="space-y-3">
              <Label>Ready for tomorrow's session?</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'yes', label: 'Ready', emoji: '💪' },
                  { value: 'maybe', label: 'Maybe', emoji: '🤷' },
                  { value: 'no', label: 'Need Rest', emoji: '😴' },
                ] as const).map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm({ ...form, ready_tomorrow: opt.value })}
                    className={`py-3 rounded-xl border-2 text-center transition-all ${
                      form.ready_tomorrow === opt.value ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.emoji}</div>
                    <div className="text-xs font-semibold">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-y border-slate-100">
              <Label>Studying tonight?</Label>
              <button type="button"
                onClick={() => setForm({ ...form, studying_tonight: !form.studying_tonight })}
                className={`w-12 h-6 rounded-full transition-colors ${form.studying_tonight ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.studying_tonight ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="space-y-2">
              <Label>Optional note to coach</Label>
              <textarea
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#1e3a5f] transition-colors"
                rows={2}
                placeholder="Anything your coach should know..."
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-6">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Session Logged!</h3>
            <p className="text-slate-500 text-sm">Your coach has your feedback.</p>
            {form.has_pain && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-left">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">Pain flag sent to your coach.</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && step < steps.length - 1 && (
            <Button variant="outline" size="lg" className="flex-1" onClick={back}>Back</Button>
          )}
          {step < steps.length - 2 && (
            <Button size="lg" className="flex-1" onClick={next}>Continue</Button>
          )}
          {step === steps.length - 2 && (
            <Button size="lg" className="flex-1" onClick={next}>Submit</Button>
          )}
          {step === steps.length - 1 && (
            <Button size="lg" className="flex-1" onClick={onDone}>Done</Button>
          )}
        </div>
      </div>
    </div>
  )
}
