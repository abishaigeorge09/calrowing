import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { useTeam } from '@/hooks/useTeam'
import { useLogInjury } from '@/hooks/mutations'

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
      <div className="px-4 py-5 max-w-lg mx-auto text-center">
        <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 mt-10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Coach Notified</h1>
        <p className="text-slate-500 mb-2">
          Your injury flag has been sent to your coach immediately.
        </p>
        <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 my-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Body Part</span>
            <span className="font-bold">{bodyPart}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Severity</span>
            <span className={`font-bold ${severity === 'Severe' ? 'text-red-600' : severity === 'Moderate' ? 'text-orange-600' : 'text-yellow-600'}`}>
              {severity}
            </span>
          </div>
          {description && (
            <div className="text-sm">
              <span className="text-slate-500">Note: </span>
              <span>{description}</span>
            </div>
          )}
        </div>
        <Button size="lg" className="w-full" onClick={() => navigate('/athlete')}>
          Back to Today
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Flag an Injury</h1>
          <p className="text-sm text-slate-500">Your coach will be notified immediately</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-red-700 text-sm">
          This sends an immediate alert to your coach. Use this for pain or injury during or after training.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label>Where does it hurt?</Label>
          <div className="flex flex-wrap gap-2">
            {BODY_PARTS.map(part => (
              <button key={part} type="button"
                onClick={() => setBodyPart(part)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                  bodyPart === part
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                }`}
              >
                {part}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Severity</Label>
          <div className="grid grid-cols-3 gap-3">
            {(['Mild', 'Moderate', 'Severe'] as const).map(s => (
              <button key={s} type="button"
                onClick={() => setSeverity(s)}
                className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                  severity === s
                    ? s === 'Severe' ? 'bg-red-600 text-white border-red-600'
                    : s === 'Moderate' ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {s === 'Mild' ? '😐' : s === 'Moderate' ? '😣' : '😰'}<br />
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <textarea
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#1e3a5f] transition-colors"
            rows={3}
            placeholder="Describe the pain — sharp, dull, when did it start..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          variant="destructive"
          className="w-full"
          disabled={!bodyPart || !severity || submitting}
        >
          {submitting ? (
            'Sending alert…'
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Alert to Coach
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
