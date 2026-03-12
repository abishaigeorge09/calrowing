import { useState } from 'react'
import { Check, Hexagon, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { useCreateSession } from '@/hooks/mutations'
import { localDateStr, cn } from '@/lib/utils'
import type { SessionType, Intensity } from '@/types/database'

interface Props { open: boolean; onClose: () => void }

export default function CreateSessionDialog({ open, onClose }: Props) {
  const { user } = useAuthStore()
  const createSession = useCreateSession()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    date: localDateStr(),
    type: 'Erg' as SessionType,
    duration: '90',
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
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.team_id) return

    try {
      await createSession.mutateAsync({
        team_id: user.team_id,
        date: form.date,
        type: form.type,
        duration: parseInt(form.duration) || 90,
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
      })

      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setForm({
          date: localDateStr(),
          type: 'Erg',
          duration: '90',
          intensity: 'Moderate',
          warmup: '',
          main_set: '',
          cooldown: '',
          target_split: '',
          stroke_rate: '',
          hr_zone: '',
          assigned_to: 'whole_team',
          coach_notes: '',
          is_notes_public: true,
        })
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Failed to create session:', err)
    }
  }

  const darkInputClasses = "bg-black/50 border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl h-11"
  const darkLabelClasses = "text-[10px] uppercase tracking-widest text-gray-400 font-bold"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-black/90 backdrop-blur-3xl border border-white/10 text-white rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:rounded-[2rem]">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-[50px] rounded-full pointer-events-none" />

        <DialogHeader className="relative z-10 space-y-3">
          <DialogTitle className="text-xl font-black tracking-widest uppercase flex items-center gap-3 border-b border-white/5 pb-4">
            <Hexagon className="h-6 w-6 text-white" /> Compiler Interface
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10 pt-2">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col">
              <Label className={darkLabelClasses}>Date Parameter</Label>
              <Input type="date" value={form.date} className={darkInputClasses} style={{ colorScheme: 'dark' }}
                onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            
            <div className="space-y-1.5 flex flex-col">
              <Label className={darkLabelClasses}>Protocol Type</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col">
              <Label className={darkLabelClasses}>Duration (Min)</Label>
              <Input type="number" placeholder="90" value={form.duration} className={darkInputClasses}
                onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            
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

          <div className="space-y-1.5">
            <Label className={darkLabelClasses}>Startup Sequence (Warmup)</Label>
            <Input placeholder="Define parameters..." value={form.warmup} className={darkInputClasses}
              onChange={(e) => setForm({ ...form, warmup: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label className={darkLabelClasses}>Main Execution Loop *</Label>
            <textarea
              className="w-full bg-black/50 border border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none transition-colors shadow-inner min-h-[100px]"
              placeholder="e.g. 4x2000m @ 2:05/500m, r20..."
              value={form.main_set}
              onChange={(e) => setForm({ ...form, main_set: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className={darkLabelClasses}>Shutdown Sequence (Cooldown)</Label>
            <Input placeholder="Define parameters..." value={form.cooldown} className={darkInputClasses}
              onChange={(e) => setForm({ ...form, cooldown: e.target.value })} />
          </div>

           <div className="grid grid-cols-3 gap-3 pt-2 pb-2 border-y border-white/5">
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
            <Label className={darkLabelClasses}>Target Array (Assign)</Label>
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
            <Label className={darkLabelClasses}>Director Embedded Data (Notes)</Label>
            <Input placeholder="Secret params..." value={form.coach_notes} className={darkInputClasses}
              onChange={(e) => setForm({ ...form, coach_notes: e.target.value })} />
            <div className="flex items-center gap-2 mt-2 px-1">
              <input type="checkbox" id="notes-public" checked={form.is_notes_public}
                onChange={(e) => setForm({ ...form, is_notes_public: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-white focus:ring-slate-500 accent-white/20 bg-black/50"
              />
              <label htmlFor="notes-public" className="text-[10px] uppercase font-bold tracking-widest text-gray-500 cursor-pointer">Unmask to Nodes (Public)</label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/5 flex gap-3 sm:justify-between w-full">
            <DialogClose asChild>
              <Button type="button" variant="outline" 
                className="bg-transparent border-white/20 text-white hover:bg-white/10 uppercase tracking-widest text-xs font-bold rounded-xl h-11 flex-1 sm:flex-none sm:w-1/3"
                disabled={createSession.isPending}>
                Abort
              </Button>
            </DialogClose>
            <Button type="submit" 
              className={cn('uppercase tracking-widest text-xs font-bold rounded-xl h-11 flex-1 sm:flex-none sm:w-2/3 transition-all', 
                saved ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]')}
              disabled={createSession.isPending || saved}>
              {saved
                ? <><Check className="h-4 w-4 mr-2" /> Deployed</>
                : createSession.isPending ? 'Compiling…' : 'Compile To Array'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
