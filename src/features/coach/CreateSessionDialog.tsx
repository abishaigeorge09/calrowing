import { useState } from 'react'
import { Check, Hexagon, Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { useCreateSession } from '@/hooks/mutations'
import { localDateStr, cn } from '@/lib/utils'
import type { SessionType, Intensity, MediaItem } from '@/types/database'

interface Props { open: boolean; onClose: () => void }

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function detectMediaType(url: string): 'image' | 'video' | 'link' {
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) return 'image'
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return 'video'
  return 'link'
}

const defaultForm = {
  date: localDateStr(),
  type: 'Erg' as SessionType,
  start_time: '09:00',
  end_time: '10:30',
  intensity: 'Moderate' as Intensity,
  warmup: '',
  main_set: '',
  cooldown: '',
  target_split: '',
  stroke_rate: '',
  hr_zone: '',
  assigned_to: 'whole_team',
  coach_notes: '',
  is_notes_public: true,
}

export default function CreateSessionDialog({ open, onClose }: Props) {
  const { user } = useAuthStore()
  const createSession = useCreateSession()
  const [saved, setSaved] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [step, setStep] = useState(0)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')

  const addLink = () => {
    if (!linkUrl.trim()) return
    setMediaItems(prev => [...prev, {
      url: linkUrl.trim(),
      title: linkTitle.trim() || undefined,
      type: detectMediaType(linkUrl.trim()),
    }])
    setLinkUrl('')
    setLinkTitle('')
  }

  const removeMedia = (i: number) => setMediaItems(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSubmitError('')
    if (!user?.team_id) {
      setSubmitError('Your account is not linked to a team yet. Please contact support.')
      return
    }

    const duration = timeToMinutes(form.end_time) - timeToMinutes(form.start_time)
    try {
      await createSession.mutateAsync({
        team_id: user.team_id,
        date: form.date,
        type: form.type,
        duration: Math.max(duration, 0),
        start_time: form.start_time,
        end_time: form.end_time,
        intensity: form.intensity,
        warmup: form.warmup || undefined,
        main_set: form.main_set,
        cooldown: form.cooldown || undefined,
        target_split: form.target_split || undefined,
        stroke_rate: form.stroke_rate || undefined,
        hr_zone: form.hr_zone || undefined,
        assigned_to: form.assigned_to,
        coach_notes: form.coach_notes || undefined,
        is_notes_public: form.is_notes_public,
        media_urls: mediaItems,
      })

      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setForm(defaultForm)
        setMediaItems([])
        setStep(0)
        onClose()
      }, 1200)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create session. Please try again.')
      console.error('Failed to create session:', err)
    }
  }

  const darkInputClasses = "bg-black/50 border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl h-11"
  const darkLabelClasses = "text-[10px] uppercase tracking-widest text-gray-400 font-bold"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-black/90 backdrop-blur-3xl border border-white/10 text-white rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-[50px] rounded-full pointer-events-none" />

        <DialogHeader className="relative z-10 space-y-3">
          <DialogTitle className="text-xl font-black tracking-widest uppercase flex flex-col gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <Hexagon className="h-6 w-6 text-white" /> Create Session
            </div>
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(s => (
                <div key={s} className={cn(
                  "h-1.5 rounded-full transition-all",
                  s === step ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" :
                  s < step ? "w-4 bg-white/50" : "w-4 bg-white/10"
                )} />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-[420px] relative z-10 pt-2">
          <div className="flex-1 space-y-5">
            {step === 0 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col">
              <Label className={darkLabelClasses}>Date Parameter</Label>
              <Input type="date" value={form.date} className={darkInputClasses} style={{ colorScheme: 'dark' }}
                onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>

            <div className="space-y-1.5 flex flex-col">
              <Label className={darkLabelClasses}>Session Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as SessionType })}>
                <SelectTrigger className={darkInputClasses}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black/95 border-white/20 text-white backdrop-blur-xl">
                  {(['Erg', 'Water', 'Weights', 'Cross Training', 'Rest'] as SessionType[]).map(t => (
                    <SelectItem key={t} value={t} className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-xs font-bold">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col">
              <Label className={darkLabelClasses}>Start Time</Label>
              <Input type="time" value={form.start_time} className={darkInputClasses} style={{ colorScheme: 'dark' }}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label className={darkLabelClasses}>End Time</Label>
              <Input type="time" value={form.end_time} className={darkInputClasses} style={{ colorScheme: 'dark' }}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          {form.start_time && form.end_time && (
            <p className="text-[10px] text-gray-500 -mt-3 px-1">
              Duration: {Math.max(timeToMinutes(form.end_time) - timeToMinutes(form.start_time), 0)} min
            </p>
          )}

          <div className="space-y-1.5 flex flex-col">
            <Label className={darkLabelClasses}>Intensity Level</Label>
            <Select value={form.intensity} onValueChange={(v) => setForm({ ...form, intensity: v as Intensity })}>
              <SelectTrigger className={darkInputClasses}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-black/95 border-white/20 text-white backdrop-blur-xl">
                {(['Low', 'Moderate', 'High', 'Race Pace'] as Intensity[]).map(i => (
                  <SelectItem key={i} value={i} className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-xs font-bold">{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1.5">
                <Label className={darkLabelClasses}>Warmup</Label>
                <Input placeholder="Define warmup..." value={form.warmup} className={darkInputClasses}
                  onChange={(e) => setForm({ ...form, warmup: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className={darkLabelClasses}>Workout Details (Main Set) *</Label>
            <textarea
              className="w-full bg-black/50 border border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none transition-colors shadow-inner min-h-[100px]"
              placeholder="e.g. 4x2000m @ 2:05/500m, r20..."
              value={form.main_set}
              onChange={(e) => setForm({ ...form, main_set: e.target.value })}
              required
            />
          </div>

              <div className="space-y-1.5">
                <Label className={darkLabelClasses}>Cooldown</Label>
                <Input placeholder="Cooldown instructions..." value={form.cooldown} className={darkInputClasses}
                  onChange={(e) => setForm({ ...form, cooldown: e.target.value })} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 flex flex-col">
              <Label className={cn(darkLabelClasses, 'truncate')} title="Target Split">Split</Label>
              <Input placeholder="2:02" value={form.target_split} className={darkInputClasses}
                onChange={(e) => setForm({ ...form, target_split: e.target.value })} />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label className={cn(darkLabelClasses, 'truncate')} title="Stroke Rate">Rate</Label>
              <Input type="number" placeholder="20" value={form.stroke_rate} className={darkInputClasses}
                onChange={(e) => setForm({ ...form, stroke_rate: e.target.value })} />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label className={cn(darkLabelClasses, 'truncate')} title="HR Zone">HR</Label>
              <Input placeholder="Z4" value={form.hr_zone} className={darkInputClasses}
                onChange={(e) => setForm({ ...form, hr_zone: e.target.value })} />
            </div>
              </div>

              <div className="space-y-1.5">
                <Label className={darkLabelClasses}>Assign To</Label>
            <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
              <SelectTrigger className={darkInputClasses}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/20 text-white backdrop-blur-xl">
                    <SelectItem value="whole_team" className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-xs font-bold">Base Array (All)</SelectItem>
                <SelectItem value="Varsity 8" className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-xs font-bold">Varsity 8</SelectItem>
                <SelectItem value="JV 8" className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-xs font-bold">JV 8</SelectItem>
              </SelectContent>
            </Select>
          </div>

              <div className="space-y-1.5">
                <Label className={darkLabelClasses}>Coach Notes</Label>
                <Input placeholder="Secret params..." value={form.coach_notes} className={darkInputClasses}
                  onChange={(e) => setForm({ ...form, coach_notes: e.target.value })} />
                <div className="flex items-center gap-2 mt-2 px-1">
                  <input type="checkbox" id="notes-public" checked={form.is_notes_public}
                    onChange={(e) => setForm({ ...form, is_notes_public: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-white focus:ring-slate-500 accent-white/20 bg-black/50"
                  />
                  <label htmlFor="notes-public" className="text-[10px] uppercase font-bold tracking-widest text-gray-500 cursor-pointer">Visible to Athletes</label>
                </div>
              </div>

              <div className="space-y-2 pt-1 pb-2 border-t border-white/5">
                <Label className={darkLabelClasses}>Resource Links (Optional)</Label>
            <div className="flex gap-2">
              <Input placeholder="Paste URL (YouTube, image, article...)" value={linkUrl} className={cn(darkInputClasses, 'flex-1 text-xs')}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} />
              <Input placeholder="Title" value={linkTitle} className={cn(darkInputClasses, 'w-28 text-xs')}
                onChange={(e) => setLinkTitle(e.target.value)} />
              <Button type="button" onClick={addLink}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-11 px-3 border border-white/10">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {mediaItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {mediaItems.map((m, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs">
                      <span>{m.type === 'video' ? '▶' : m.type === 'image' ? '🖼' : '🔗'}</span>
                      <span className="max-w-[120px] truncate text-gray-300">{m.title || m.url}</span>
                      <button type="button" onClick={() => removeMedia(i)} className="text-gray-500 hover:text-white ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          )}
          </div>

          {submitError && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              {submitError}
            </div>
          )}
          <DialogFooter className="pt-4 border-t border-white/5 mt-auto flex flex-row gap-3 sm:justify-between w-full">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}
                className="bg-transparent border-white/20 text-white hover:bg-white/10 uppercase tracking-widest text-xs font-bold rounded-xl h-11 flex-1 sm:flex-none sm:w-1/3"
                disabled={createSession.isPending}>
                Back
              </Button>
            ) : (
              <DialogClose asChild>
                <Button type="button" variant="outline"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 uppercase tracking-widest text-xs font-bold rounded-xl h-11 flex-1 sm:flex-none sm:w-1/3"
                  disabled={createSession.isPending}>
                  Cancel
                </Button>
              </DialogClose>
            )}

            {step < 2 ? (
              <Button type="button" onClick={() => setStep(step + 1)}
                className="bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)] uppercase tracking-widest text-xs font-bold rounded-xl h-11 flex-1 sm:flex-none sm:w-2/3 transition-all"
                disabled={!form.date || !form.type}>
                Next Step
              </Button>
            ) : (
              <Button type="button" onClick={() => handleSubmit()}
                className={cn('uppercase tracking-widest text-xs font-bold rounded-xl h-11 flex-1 sm:flex-none sm:w-2/3 transition-all',
                  saved ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]')}
                disabled={createSession.isPending || saved}>
                {saved
                  ? <><Check className="h-4 w-4 mr-2" /> Created!</>
                  : createSession.isPending ? 'Saving…' : 'Create Session'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
