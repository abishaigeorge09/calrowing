import { useState } from 'react'
import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { useCreateSession } from '@/hooks/mutations'
import type { SessionType, Intensity } from '@/types/database'

interface Props { open: boolean; onClose: () => void }

export default function CreateSessionDialog({ open, onClose }: Props) {
  const { user } = useAuthStore()
  const createSession = useCreateSession()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
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
        // Reset form for next use
        setForm({
          date: new Date().toISOString().split('T')[0],
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Training Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Session Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as SessionType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['Erg', 'Water', 'Weights', 'Cross Training', 'Rest'] as SessionType[]).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration + Intensity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" placeholder="90" value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Intensity</Label>
              <Select value={form.intensity} onValueChange={(v) => setForm({ ...form, intensity: v as Intensity })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['Low', 'Moderate', 'High', 'Race Pace'] as Intensity[]).map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Warmup */}
          <div className="space-y-1.5">
            <Label>Warmup</Label>
            <Input placeholder="10 min easy, focus on catch timing" value={form.warmup}
              onChange={(e) => setForm({ ...form, warmup: e.target.value })} />
          </div>

          {/* Main Set */}
          <div className="space-y-1.5">
            <Label>Main Set *</Label>
            <textarea
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] resize-none transition-colors"
              rows={3}
              placeholder="4x2000m @ 2:05/500m, r20, 5 min rest between pieces"
              value={form.main_set}
              onChange={(e) => setForm({ ...form, main_set: e.target.value })}
              required
            />
          </div>

          {/* Cooldown */}
          <div className="space-y-1.5">
            <Label>Cooldown</Label>
            <Input placeholder="10 min easy rowing, stretching" value={form.cooldown}
              onChange={(e) => setForm({ ...form, cooldown: e.target.value })} />
          </div>

          {/* Target Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Target Split</Label>
              <Input placeholder="2:02/500m" value={form.target_split}
                onChange={(e) => setForm({ ...form, target_split: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Stroke Rate</Label>
              <Input type="number" placeholder="20" value={form.stroke_rate}
                onChange={(e) => setForm({ ...form, stroke_rate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>HR Zone</Label>
              <Input placeholder="Zone 4-5" value={form.hr_zone}
                onChange={(e) => setForm({ ...form, hr_zone: e.target.value })} />
            </div>
          </div>

          {/* Assign To */}
          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whole_team">Whole Team</SelectItem>
                <SelectItem value="Varsity 8">Varsity 8</SelectItem>
                <SelectItem value="JV 8">JV 8</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coach Notes */}
          <div className="space-y-1.5">
            <Label>Coach Notes (optional)</Label>
            <Input placeholder="Trust your training. Focus on ratio." value={form.coach_notes}
              onChange={(e) => setForm({ ...form, coach_notes: e.target.value })} />
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" id="notes-public" checked={form.is_notes_public}
                onChange={(e) => setForm({ ...form, is_notes_public: e.target.checked })}
                className="w-4 h-4 accent-[#1e3a5f]"
              />
              <label htmlFor="notes-public" className="text-sm text-slate-600">Visible to athletes</label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}
              disabled={createSession.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant={saved ? 'success' : 'default'}
              disabled={createSession.isPending || saved}>
              {saved
                ? <><Check className="h-4 w-4 mr-1" /> Published!</>
                : createSession.isPending ? 'Publishing…' : 'Publish Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
