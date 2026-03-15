import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Hexagon, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
      if (user?.role === 'superadmin') navigate('/superadmin')
      else if (user?.role === 'coach' && (user.status === 'pending' || user.status === 'rejected')) navigate('/pending-approval')
      else navigate(user?.role === 'coach' ? '/coach' : '/athlete')
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Demo1234!')
    setError('')
  }

  return (
    <div className="relative min-h-dvh bg-black flex flex-col text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/[0.04] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.03] blur-[120px] rounded-full" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">

        <div className="w-full max-w-sm">
          {/* Header — logo + heading as one unit */}
          <div className="text-center mb-7">
            <Link to="/" className="inline-flex items-center gap-2 mb-5 opacity-60 hover:opacity-100 transition-opacity">
              <Hexagon className="h-4 w-4 text-white" strokeWidth={1.5} />
              <span className="text-xs font-bold text-white tracking-widest uppercase">RowIQ</span>
            </Link>
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">Sign in</h1>
            <p className="text-gray-500 text-sm">Enter your credentials to continue</p>
          </div>

          {/* Demo quick-access */}
          <div className="mb-6 p-4 rounded-2xl border border-white/8 bg-white/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Try a Demo</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => fillDemo('coach@rowiq.demo')}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all bg-white/8 border border-white/10 hover:bg-white/15 text-white"
              >
                Coach Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('alex@rowiq.demo')}
                className="py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide transition-all bg-white text-black hover:bg-gray-100"
              >
                Athlete Demo
              </button>
            </div>
            <div className="flex gap-3">
              {[['Jordan', 'jordan@rowiq.demo'], ['Sam', 'sam@rowiq.demo'], ['Taylor', 'taylor@rowiq.demo']].map(([name, demoEmail]) => (
                <button key={name} type="button" onClick={() => fillDemo(demoEmail)}
                  className="text-[10px] text-gray-500 hover:text-gray-200 uppercase tracking-wider transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">or sign in</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="bg-black/40 border-white/10 focus:border-white/40 text-white placeholder:text-gray-600 rounded-xl h-11 px-4"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Password</label>
                <Link to="/forgot-password" className="text-[10px] text-gray-500 hover:text-gray-200 uppercase tracking-wider transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="bg-black/40 border-white/10 focus:border-white/40 text-white placeholder:text-gray-600 rounded-xl h-11 px-4"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/25 rounded-xl px-4 py-3 text-red-300 text-xs leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50 font-bold tracking-widest uppercase rounded-xl h-11 text-xs transition-all flex items-center justify-center gap-2 group mt-1"
            >
              {loading ? 'Signing in…' : (
                <>
                  Sign In
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/8 text-center space-y-3">
            <p className="text-xs text-gray-500">New to RowIQ?</p>
            <div className="flex justify-center gap-6 text-xs">
              <Link to="/register/coach" className="text-gray-300 hover:text-white font-semibold transition-colors">
                Register as Coach
              </Link>
              <span className="text-white/15">|</span>
              <Link to="/register/athlete" className="text-gray-300 hover:text-white font-semibold transition-colors">
                Join as Athlete
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
