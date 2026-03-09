import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Waves, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { generateInviteCode } from '@/lib/utils'
import type { Profile } from '@/types/database'

type Step = 'account' | 'team' | 'done'
type ProgressStep = 'account' | 'team'

export default function RegisterCoachPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('account')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    teamName: '', division: '', seasonStart: '', seasonEnd: '',
  })

  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('team')
  }

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const code = generateInviteCode(form.teamName)
    setInviteCode(code)

    if (!IS_SUPABASE) {
      // Demo mode: create a local mock profile
      const mockProfile: Profile = {
        id: `coach-${Date.now()}`,
        email: form.email,
        name: form.name,
        role: 'coach',
        team_id: `team-${Date.now()}`,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }
      useAuthStore.setState({ user: mockProfile })
      setLoading(false)
      setStep('done')
      return
    }

    try {
      // 1. Create auth user (trigger inserts profile row automatically)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { role: 'coach', name: form.name },
        },
      })
      if (signUpError) throw new Error(signUpError.message)
      if (!authData.user) throw new Error('Sign up failed — please try again.')

      // 2. Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: form.teamName,
          invite_code: code,
          sport: 'Rowing',
          division: form.division || null,
          season_start: form.seasonStart || null,
          season_end: form.seasonEnd || null,
          coach_id: authData.user.id,
        })
        .select()
        .single()
      if (teamError) throw new Error(teamError.message)

      // 3. Update profile with team_id (trigger created the row, just needs team)
      await supabase
        .from('profiles')
        .update({ team_id: team.id })
        .eq('id', authData.user.id)

      // 4. Fetch the full profile and put it in the auth store
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      if (profile) useAuthStore.setState({ user: profile as Profile })

      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'done') {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0f2d52] to-[#1e3a5f] flex flex-col">
        <div className="flex-1 bg-white rounded-t-3xl mt-20 px-6 pt-8 pb-8 flex flex-col items-center text-center">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Team Created!</h1>
          <p className="text-slate-500 mb-6">
            Share this invite code with your athletes so they can join your team.
          </p>

          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl px-8 py-6 mb-6 w-full">
            <p className="text-xs text-slate-500 mb-1">Team Invite Code</p>
            <p className="text-3xl font-black text-[#1e3a5f] tracking-widest mb-4">{inviteCode}</p>
            <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy code</>}
            </Button>
          </div>

          <p className="text-sm text-slate-500 mb-6">
            Your team: <strong>{form.teamName}</strong>
          </p>

          <Button size="lg" className="w-full" onClick={() => navigate('/coach')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0f2d52] to-[#1e3a5f] flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-12 pb-6">
        <Link to="/login" className="text-white/70 hover:text-white">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-2">
          <Waves className="h-6 w-6 text-white" />
          <span className="text-xl font-black text-white">RowIQ</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-8">
        <div className="flex gap-2 mb-6">
          {(['account', 'team'] as ProgressStep[]).map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${(step as string) === s || ((step as string) === 'done' && i < 2) ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 'account' && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Coach Account</h1>
            <p className="text-slate-500 text-sm mb-6">Step 1 of 2 — Your account details</p>
            <form onSubmit={handleAccountNext} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Coach Mike Teti" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="coach@berkeley.edu" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
              </div>
              <Button type="submit" size="lg" className="w-full">Continue</Button>
            </form>
          </>
        )}

        {step === 'team' && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Set Up Your Team</h1>
            <p className="text-slate-500 text-sm mb-6">Step 2 of 2 — Team details</p>
            <form onSubmit={handleTeamSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Team Name</Label>
                <Input placeholder="UC Berkeley Men's Rowing" value={form.teamName}
                  onChange={(e) => setForm({ ...form, teamName: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Division</Label>
                <Select value={form.division} onValueChange={(v) => setForm({ ...form, division: v })}>
                  <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                  <SelectContent>
                    {['NCAA D1', 'NCAA D2', 'NCAA D3', 'NAIA', 'Club', 'High School'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Season Start</Label>
                  <Input type="date" value={form.seasonStart}
                    onChange={(e) => setForm({ ...form, seasonStart: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Season End</Label>
                  <Input type="date" value={form.seasonEnd}
                    onChange={(e) => setForm({ ...form, seasonEnd: e.target.value })} required />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep('account')}>
                  Back
                </Button>
                <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Team'}
                </Button>
              </div>
            </form>
          </>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1e3a5f] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
