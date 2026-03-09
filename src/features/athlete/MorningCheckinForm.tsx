import { useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TapRating, Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

interface Props {
  onClose: () => void
  onDone: () => void
}

const BODY_PARTS = ['Head', 'Neck', 'Shoulder (L)', 'Shoulder (R)', 'Upper Back', 'Lower Back', 'Core', 'Hip', 'Quad (L)', 'Quad (R)', 'Hamstring', 'Knee', 'Calf', 'Foot']

export default function MorningCheckinForm({ onClose, onDone }: Props) {
  const [step, setStep] = useState(0)
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

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const energyLabels = ['', 'Very Low', 'Low', 'OK', 'Good', 'Great']
  const qualityLabels = ['', 'Poor', 'Fair', 'OK', 'Good', 'Excellent']
  const stressLabels = ['', 'None', 'Low', 'Moderate', 'High', 'Very High']
  const motivationLabels = ['', 'Dread', 'Low', 'OK', 'Motivated', 'Pumped']

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end">
      <div className="bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Morning Check-in</p>
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
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Sleep hours last night</Label>
              <div className="text-center">
                <span className="text-5xl font-black text-[#1e3a5f]">{form.sleep_hours}</span>
                <span className="text-slate-500 ml-1">hrs</span>
              </div>
              <Slider min={3} max={12} step={0.5} value={form.sleep_hours}
                onChange={(v) => setForm({ ...form, sleep_hours: v })} showValue={false} />
              <div className="flex justify-between text-xs text-slate-400">
                <span>3h</span><span>6h</span><span>8h</span><span>12h</span>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Sleep quality</Label>
              <TapRating min={1} max={5} value={form.sleep_quality}
                onChange={(v) => setForm({ ...form, sleep_quality: v })}
                labels={qualityLabels.slice(1)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Energy level right now</Label>
              <TapRating min={1} max={5} value={form.energy}
                onChange={(v) => setForm({ ...form, energy: v })}
                labels={energyLabels.slice(1)} />
            </div>
            <div className="space-y-3">
              <Label>Mental stress today</Label>
              <TapRating min={1} max={5} value={form.stress}
                onChange={(v) => setForm({ ...form, stress: v })}
                labels={stressLabels.slice(1)} />
            </div>
            <div className="space-y-3">
              <Label>Motivation to train</Label>
              <TapRating min={1} max={5} value={form.motivation}
                onChange={(v) => setForm({ ...form, motivation: v })}
                labels={motivationLabels.slice(1)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Any soreness or pain?</Label>
              <div className="flex gap-3">
                {(['No', 'Yes'] as const).map(opt => (
                  <button key={opt} type="button"
                    onClick={() => setForm({ ...form, has_soreness: opt === 'Yes' })}
                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                      form.has_soreness === (opt === 'Yes')
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {form.has_soreness && (
              <>
                <div className="space-y-2">
                  <Label>Where?</Label>
                  <div className="flex flex-wrap gap-2">
                    {BODY_PARTS.map(part => (
                      <button key={part} type="button"
                        onClick={() => setForm({ ...form, soreness_body_part: part })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                          form.soreness_body_part === part
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Soreness level</Label>
                  <TapRating min={1} max={5} value={form.soreness_level}
                    onChange={(v) => setForm({ ...form, soreness_level: v })}
                    labels={['Mild', 'Minor', 'Moderate', 'Significant', 'Severe']} />
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Classes today</Label>
              <TapRating min={0} max={5} value={form.classes_today}
                onChange={(v) => setForm({ ...form, classes_today: v })}
                labels={['0', '1', '2', '3', '4', '5']} />
            </div>
            <div className="flex items-center justify-between py-3 border-y border-slate-100">
              <Label>Assignment due today?</Label>
              <button type="button"
                onClick={() => setForm({ ...form, assignments_due: !form.assignments_due })}
                className={`w-12 h-6 rounded-full transition-colors ${form.assignments_due ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.assignments_due ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <Label>Exam this week?</Label>
              <button type="button"
                onClick={() => setForm({ ...form, exam_this_week: !form.exam_this_week })}
                className={`w-12 h-6 rounded-full transition-colors ${form.exam_this_week ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.exam_this_week ? 'translate-x-6' : 'translate-x-0'}`} />
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

        {step === 4 && (
          <div className="text-center py-6">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Check-in Complete!</h3>
            <p className="text-slate-500 text-sm mb-1">Your coach can see your data.</p>
            <div className="bg-slate-50 rounded-2xl p-4 mt-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sleep</span>
                <span className="font-bold">{form.sleep_hours}h (quality {form.sleep_quality}/5)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Energy</span>
                <span className="font-bold">{form.energy}/5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stress</span>
                <span className="font-bold">{form.stress}/5</span>
              </div>
              {form.has_soreness && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Soreness</span>
                  <span className="font-bold text-orange-600">{form.soreness_body_part} ({form.soreness_level}/5)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && step < 4 && (
            <Button variant="outline" size="lg" className="flex-1" onClick={back}>Back</Button>
          )}
          {step < 3 && (
            <Button size="lg" className="flex-1" onClick={next}>Continue</Button>
          )}
          {step === 3 && (
            <Button size="lg" className="flex-1" onClick={next}>Submit Check-in</Button>
          )}
          {step === 4 && (
            <Button size="lg" className="flex-1" onClick={onDone}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
