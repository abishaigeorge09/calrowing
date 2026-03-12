import { useState } from 'react'
import {
  ClipboardList, Plus, ChevronRight, ChevronLeft, Trash2,
  Check, Users, X, GripVertical,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useSurveys, useTeamSurveyAssignments } from '@/hooks/useSurveys'
import { useCreateSurvey } from '@/hooks/mutations'
import { SURVEY_TEMPLATES } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { SurveyQuestion } from '@/types/database'

type Step = 'list' | 'choose' | 'build' | 'sent'

const QUESTION_TYPES = [
  { value: 'scale_1_10', label: 'Scale 1–10' },
  { value: 'scale_1_5',  label: 'Scale 1–5' },
  { value: 'yes_no',     label: 'Yes / No' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'text',       label: 'Free text' },
] as const

function newQ(): SurveyQuestion {
  return { id: `q-${Date.now()}`, type: 'scale_1_5', text: '' }
}

export default function SurveysPage() {
  const { user } = useAuthStore()
  const [step, setStep] = useState<Step>('list')
  const [viewSurveyId, setViewSurveyId] = useState<string | null>(null)

  // Survey list + assignments
  const { data: surveys = [] } = useSurveys(user?.team_id)
  const { data: allAssignments = [] } = useTeamSurveyAssignments(user?.team_id)
  const createSurvey = useCreateSurvey()

  // My created surveys (non-template)
  const mySurveys = surveys.filter(s => !s.is_template)

  // Builder state
  const [builderTitle, setBuilderTitle] = useState('')
  const [builderDesc, setBuilderDesc]   = useState('')
  const [builderQs, setBuilderQs]       = useState<SurveyQuestion[]>([newQ()])
  const [assignTo, setAssignTo]         = useState<'team'>('team')
  const [dueDate, setDueDate]           = useState('')
  const [saved, setSaved]               = useState(false)

  function loadTemplate(tpl: typeof SURVEY_TEMPLATES[0]) {
    setBuilderTitle(tpl.title)
    setBuilderDesc(tpl.description)
    setBuilderQs(tpl.questions as SurveyQuestion[])
    setStep('build')
  }

  function startBlank() {
    setBuilderTitle('')
    setBuilderDesc('')
    setBuilderQs([newQ()])
    setStep('build')
  }

  const addQuestion = () => setBuilderQs(prev => [...prev, newQ()])
  const removeQuestion = (id: string) => setBuilderQs(prev => prev.filter(q => q.id !== id))
  const updateQ = (id: string, patch: Partial<SurveyQuestion>) =>
    setBuilderQs(prev => prev.map(q => q.id === id ? { ...q, ...patch } as SurveyQuestion : q))

  async function handleSend() {
    if (!builderTitle.trim() || !user?.team_id) return
    const validQs = builderQs.filter(q => q.text.trim())
    if (validQs.length === 0) return

    await createSurvey.mutateAsync({
      team_id: user.team_id,
      title: builderTitle.trim(),
      description: builderDesc.trim() || undefined,
      questions: validQs,
      assign_to: assignTo,
      due_at: dueDate ? new Date(dueDate + 'T23:59:59').toISOString() : null,
    })

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setStep('list')
    }, 1500)
  }

  const darkInput = "bg-black/40 border border-white/10 focus:border-white/30 text-white placeholder:text-gray-600 rounded-xl px-3 py-2 text-sm w-full focus:outline-none transition-colors"

  // Response rate helper
  function responseRate(surveyId: string) {
    const sa = allAssignments.filter(a => a.survey_id === surveyId)
    if (sa.length === 0) return null
    const done = sa.filter(a => a.completed_at).length
    return { done, total: sa.length }
  }

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto space-y-6 text-white">

      {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
      {step === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black tracking-widest uppercase flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-gray-400" /> Surveys
            </h1>
            <button
              onClick={() => setStep('choose')}
              className="flex items-center gap-2 bg-white text-black rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              <Plus className="h-4 w-4" /> New Survey
            </button>
          </div>

          {mySurveys.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-4">
              <ClipboardList className="h-12 w-12 text-white/10 mx-auto" />
              <p className="text-gray-500 text-sm font-bold tracking-wide">No surveys sent yet</p>
              <p className="text-gray-600 text-xs">Create a survey from a template or start from scratch</p>
              <button onClick={() => setStep('choose')}
                className="mx-auto flex items-center gap-2 bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-white/20">
                <Plus className="h-4 w-4" /> Create First Survey
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mySurveys.map(survey => {
                const rate = responseRate(survey.id)
                return (
                  <button
                    key={survey.id}
                    onClick={() => { setViewSurveyId(survey.id === viewSurveyId ? null : survey.id) }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-white tracking-wide">{survey.title}</p>
                        {survey.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{survey.description}</p>
                        )}
                        <p className="text-[10px] text-gray-600 mt-1">{survey.questions.length} questions</p>
                      </div>
                      {rate !== null ? (
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs font-black text-white">{rate.done}/{rate.total}</p>
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest">responded</p>
                          <div className="mt-1 h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${rate.total > 0 ? rate.done / rate.total * 100 : 0}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest flex-shrink-0">No data</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Templates section */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Quick Templates</p>
            <div className="grid grid-cols-1 gap-2">
              {SURVEY_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => loadTemplate(tpl)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left hover:bg-white/10 transition-colors flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-sm text-white">{tpl.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{tpl.questions.length} questions</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── CHOOSE TEMPLATE ─────────────────────────────────────────────────── */}
      {step === 'choose' && (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('list')} className="p-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-black tracking-widest uppercase">Choose a Starting Point</h2>
          </div>
          <div className="space-y-3">
            <button onClick={startBlank}
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-left hover:bg-white/20 transition-colors flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-black text-sm">Blank Survey</p>
                <p className="text-xs text-gray-500 mt-0.5">Start from scratch with your own questions</p>
              </div>
            </button>
            {SURVEY_TEMPLATES.map(tpl => (
              <button key={tpl.id} onClick={() => loadTemplate(tpl)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left hover:bg-white/10 transition-colors flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{tpl.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{tpl.description}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{tpl.questions.length} questions · pre-filled</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── BUILDER ─────────────────────────────────────────────────────────── */}
      {step === 'build' && (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('choose')} className="p-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-black tracking-widest uppercase flex-1">Survey Builder</h2>
          </div>

          <div className="space-y-4">
            {/* Title + description */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <input placeholder="Survey title *" value={builderTitle}
                onChange={e => setBuilderTitle(e.target.value)}
                className={darkInput + ' font-bold'} />
              <input placeholder="Short description (optional)" value={builderDesc}
                onChange={e => setBuilderDesc(e.target.value)}
                className={darkInput} />
            </div>

            {/* Questions */}
            <div className="space-y-3">
              {builderQs.map((q, idx) => (
                <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Q{idx + 1}</span>
                    <select value={q.type}
                      onChange={e => updateQ(q.id, { type: e.target.value as SurveyQuestion['type'], options: undefined })}
                      className="ml-auto bg-black/40 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1 focus:outline-none">
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button onClick={() => removeQuestion(q.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input placeholder="Question text..." value={q.text}
                    onChange={e => updateQ(q.id, { text: e.target.value })}
                    className={darkInput} />
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Options (comma-separated)</p>
                      <input
                        placeholder="Option A, Option B, Option C"
                        value={q.options?.join(', ') ?? ''}
                        onChange={e => updateQ(q.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        className={darkInput} />
                    </div>
                  )}
                  {q.type === 'scale_1_10' && (
                    <p className="text-[10px] text-gray-600">Athletes will rate 1–10</p>
                  )}
                  {q.type === 'scale_1_5' && (
                    <p className="text-[10px] text-gray-600">Athletes will rate 1–5</p>
                  )}
                  {q.type === 'yes_no' && (
                    <p className="text-[10px] text-gray-600">Athletes will answer Yes or No</p>
                  )}
                </div>
              ))}
              <button onClick={addQuestion}
                className="w-full border border-dashed border-white/20 rounded-2xl py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:border-white/40 hover:text-gray-300 transition-colors flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Add Question
              </button>
            </div>

            {/* Assignment + due date */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Send To</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAssignTo('team')}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors',
                    assignTo === 'team' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20')}>
                  <Users className="h-4 w-4" /> Whole Team
                </button>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Due Date (optional)</p>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className={darkInput} style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!builderTitle.trim() || builderQs.filter(q => q.text.trim()).length === 0 || createSurvey.isPending || saved}
              className={cn('w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
                saved ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                  : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-40')}>
              {saved ? <><Check className="h-4 w-4" /> Survey Sent!</>
                : createSurvey.isPending ? 'Sending…'
                : <><ClipboardList className="h-4 w-4" /> Send Survey to Team</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
