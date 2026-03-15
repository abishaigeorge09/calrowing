import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Hexagon } from 'lucide-react'
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
    <div className="relative min-h-dvh bg-black flex flex-col font-sans overflow-hidden text-white">
      {/* Background ambient light */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-2 group">
            <div className="bg-white/10 rounded-2xl p-3 border border-white/20 group-hover:bg-white/20 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Hexagon className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-4xl font-black text-white tracking-widest uppercase">RowIQ</span>
          </Link>
          <p className="text-gray-400 text-sm tracking-widest uppercase font-semibold">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-6 font-light">Sign in to continue to RowIQ</p>

          {/* Demo Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></span>
              <p className="text-gray-200 text-sm font-bold uppercase tracking-widest">Try a Demo</p>
            </div>
            <p className="text-gray-400 text-xs mb-4 font-light">Explore the platform instantly — no registration needed.</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => fillDemo('coach@rowiq.demo')}
                className="bg-white/10 border border-white/10 hover:bg-white/20 text-white rounded-xl py-2 px-3 text-xs font-semibold tracking-wider transition-all"
              >
                Coach Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('alex@rowiq.demo')}
                className="bg-white text-black rounded-xl py-2 px-3 text-xs font-bold tracking-wider hover:bg-gray-200 transition-all shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              >
                Athlete Demo
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button type="button" onClick={() => fillDemo('jordan@rowiq.demo')} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors">Jordan</button>
              <button type="button" onClick={() => fillDemo('sam@rowiq.demo')}    className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors">Sam</button>
              <button type="button" onClick={() => fillDemo('taylor@rowiq.demo')} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors">Taylor</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-gray-400 font-bold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="bg-black/50 border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl h-12 px-4 shadow-inner"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-gray-400 font-bold">Password</Label>
                <Link to="/forgot-password" className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors">
                  Forgot password?
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
                  className="bg-black/50 border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl h-12 px-4 shadow-inner"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all font-bold tracking-widest uppercase rounded-xl h-12 mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">
              New to RowIQ?
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/register/coach" className="text-gray-300 hover:text-white font-bold transition-colors">
                Register as Coach
              </Link>
              <span className="text-white/20">|</span>
              <Link to="/register/athlete" className="text-gray-300 hover:text-white font-bold transition-colors">
                Join as Athlete
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
