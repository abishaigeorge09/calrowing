import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle2, ClipboardList } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useSurveyAssignments } from '@/hooks/useSurveys'
import { useSubmitSurveyResponse } from '@/hooks/mutations'
import type { SurveyQuestion } from '@/types/database'
import { cn } from '@/lib/utils'

function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion
  value: string | number | undefined
  onChange: (v: string | number) => void
}) {
  if (question.type === 'text') {
    return (
      <textarea
        className="w-full bg-white/5 border border-white/15 focus:border-white/60 text-white placeholder:text-gray-600 rounded-2xl px-5 py-4 text-sm resize-none transition-colors min-h-[120px] outline-none"
        placeholder="Type your answer…"
        value={value as string ?? ''}
        onChange={e => onChange(e.target.value)}
      />
    )
  }

  if (question.type === 'yes_no') {
    return (
      <div className="flex gap-4">
        {(['Yes', 'No'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border',
              value === opt
                ? opt === 'Yes'
                  ? 'bg-green-500/20 border-green-400/60 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]'
                  : 'bg-red-500/20 border-red-400/60 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === 'multiple_choice' && question.options) {
    return (
      <div className="space-y-3">
        {question.options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'w-full text-left px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all border',
              value === opt
                ? 'bg-white/15 border-white/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  // scale_1_5 or scale_1_10
  const max = question.type === 'scale_1_10' ? 10 : 5
  const labels: Record<number, Record<number, string>> = {
    5: { 1: 'Very Low', 3: 'Moderate', 5: 'Very High' },
    10: { 1: 'None', 5: 'Moderate', 10: 'Severe' },
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-between">
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'flex-1 aspect-square flex items-center justify-center rounded-xl text-sm font-black transition-all border',
              value === n
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/15 hover:border-white/30'
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold px-0.5">
        <span>{labels[max]?.[1] ?? '1'}</span>
        <span>{labels[max]?.[Math.ceil(max / 2)] ?? Math.ceil(max / 2)}</span>
        <span>{labels[max]?.[max] ?? max}</span>
      </div>
    </div>
  )
}

export default function SurveyResponsePage() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: assignments = [], isLoading } = useSurveyAssignments(user?.id)
  const submitResponse = useSubmitSurveyResponse()

  const assignment = assignments.find(a => a.id === assignmentId)
  const survey = assignment?.survey

  const [step, setStep] = useState(0) // 0-based question index
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [done, setDone] = useState(false)

  const questions: SurveyQuestion[] = (survey?.questions ?? []) as SurveyQuestion[]
  const currentQ = questions[step]
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined
  const isLast = step === questions.length - 1

  const handleNext = () => {
    if (!isLast) {
      setStep(s => s + 1)
    }
  }

  const handleSubmit = async () => {
    if (!assignment || !survey) return
    await submitResponse.mutateAsync({
      survey_id: survey.id,
      assignment_id: assignment.id,
      answers,
    })
    setDone(true)
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto text-center text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  if (!assignment || !survey) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 text-sm">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-center text-gray-400 py-12">Survey not found or already completed.</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-green-400/20 blur-[40px] rounded-full" />
          <CheckCircle2 className="h-16 w-16 text-green-400 relative z-10 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
        </div>
        <div>
          <p className="text-2xl font-black text-white uppercase tracking-widest mb-2">Transmitted</p>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Response received by director</p>
        </div>
        <button
          onClick={() => navigate('/athlete')}
          className="mt-4 bg-white text-black text-xs font-black uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Return to Base
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <ClipboardList className="h-4 w-4 text-gray-400" />
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Survey Protocol</p>
          </div>
          <h1 className="text-base font-black tracking-wider text-white">{survey.title}</h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          <span>Q {step + 1} of {questions.length}</span>
          <span>{Math.round(((step) / questions.length) * 100)}% complete</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      {currentQ && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 space-y-6 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[40px] rounded-full pointer-events-none" />

          {/* Question text */}
          <p className="text-base font-semibold text-white leading-relaxed">{currentQ.text}</p>

          {/* Answer input */}
          <QuestionRenderer
            question={currentQ}
            value={currentAnswer}
            onChange={v => setAnswers(prev => ({ ...prev, [currentQ.id]: v }))}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-none px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-400 text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {!isLast ? (
          <button
            onClick={handleNext}
            disabled={currentAnswer === undefined || currentAnswer === ''}
            className={cn(
              'flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
              currentAnswer !== undefined && currentAnswer !== ''
                ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
            )}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={
              currentAnswer === undefined ||
              currentAnswer === '' ||
              submitResponse.isPending
            }
            className={cn(
              'flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              currentAnswer !== undefined && currentAnswer !== ''
                ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
            )}
          >
            {submitResponse.isPending ? 'Transmitting…' : 'Submit Response'}
          </button>
        )}
      </div>

      {/* Optional skip */}
      {currentQ?.type === 'text' && currentAnswer === '' || (currentAnswer === undefined && currentQ?.type === 'text') ? null : null}
    </div>
  )
}
