import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Waves } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      const user = useAuthStore.getState().user
      navigate(user?.role === 'coach' ? '/coach' : '/athlete')
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Demo1234!')
    setError('')
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0f2d52] via-[#1e3a5f] to-[#2d5a8e] flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 rounded-2xl p-3">
            <Waves className="h-8 w-8 text-white" />
          </div>
          <span className="text-4xl font-black text-white tracking-tight">RowIQ</span>
        </div>
        <p className="text-blue-200 text-base mt-1">Train smarter. Row faster.</p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
        <p className="text-slate-500 text-sm mb-5">Sign in to your account</p>

        {/* Demo Section — always visible so anyone can explore the app */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🚣</span>
            <p className="text-blue-800 text-sm font-bold">Try RowIQ — No signup needed</p>
          </div>
          <p className="text-blue-600 text-xs mb-3">Explore as a coach or athlete with live data and real chat.</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => fillDemo('coach@rowiq.demo')}
              className="bg-[#1e3a5f] text-white rounded-lg py-2 px-3 text-xs font-semibold hover:bg-[#2d5a8e] transition-colors"
            >
              👨‍💼 Coach View
            </button>
            <button
              type="button"
              onClick={() => fillDemo('alex@rowiq.demo')}
              className="bg-white border border-blue-200 text-[#1e3a5f] rounded-lg py-2 px-3 text-xs font-semibold hover:bg-blue-50 transition-colors"
            >
              🚣 Athlete View
            </button>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button type="button" onClick={() => fillDemo('jordan@rowiq.demo')} className="text-[10px] text-blue-500 hover:text-blue-700 underline">Jordan (alert)</button>
            <button type="button" onClick={() => fillDemo('sam@rowiq.demo')}    className="text-[10px] text-blue-500 hover:text-blue-700 underline">Sam (exam)</button>
            <button type="button" onClick={() => fillDemo('taylor@rowiq.demo')} className="text-[10px] text-blue-500 hover:text-blue-700 underline">Taylor</button>
          </div>
          <p className="text-blue-400 text-[10px] mt-2">Password: Demo1234! (auto-filled)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-[#1e3a5f] font-medium hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            New coach?{' '}
            <Link to="/register/coach" className="text-[#1e3a5f] font-semibold hover:underline">
              Create account
            </Link>
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Got an invite code?{' '}
            <Link to="/register/athlete" className="text-[#1e3a5f] font-semibold hover:underline">
              Join your team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
