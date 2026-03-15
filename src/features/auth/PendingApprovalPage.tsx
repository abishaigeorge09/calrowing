import { useNavigate } from 'react-router-dom'
import { Clock, Hexagon, LogOut, Mail } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export default function PendingApprovalPage() {
  const { signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="relative min-h-dvh bg-black flex flex-col text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-white/[0.03] blur-[100px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Hexagon className="h-5 w-5 text-white" strokeWidth={1.5} />
          <span className="font-black text-white tracking-widest uppercase text-sm">RowIQ</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-white transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">

          {/* Icon */}
          <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 bg-amber-500/15 blur-[40px] rounded-full" />
            <div className="relative bg-amber-950/30 border border-amber-500/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
              <Clock className="h-9 w-9 text-amber-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Account Under Review</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            Your coach registration is pending approval. We'll review your request and get back to you shortly.
          </p>

          {/* Info card */}
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 text-left space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">Usually within 24 hours</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">Our team reviews every coach request to keep RowIQ a trusted platform.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-0.5">You'll get an email</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">Once approved, sign in with your credentials to access your dashboard.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
