import { useNavigate } from 'react-router-dom'
import {
  Waves,
  CalendarDays,
  HeartPulse,
  BellRing,
  ChevronRight,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-white flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="bg-[#1e3a5f] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Waves className="h-6 w-6 text-orange-400" strokeWidth={2.5} />
          <span className="text-white font-black text-xl tracking-tight">RowIQ</span>
        </div>
        <button
          onClick={() => navigate('/early-access')}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Get Early Access
        </button>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0f2d52] via-[#1e3a5f] to-[#2d5a8e] px-6 pt-20 pb-32 text-center flex flex-col items-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Waves className="h-12 w-12 text-orange-400" strokeWidth={2} />
          <span className="text-white font-black text-5xl tracking-tight">RowIQ</span>
        </div>
        <h1 className="text-white font-black text-3xl leading-tight max-w-xs mb-4">
          Train smarter.<br />Row faster.
        </h1>
        <p className="text-blue-200 text-base max-w-sm leading-relaxed mb-10">
          The all-in-one platform built for competitive rowing programs — connecting coaches and athletes through data that actually matters.
        </p>
        <button
          onClick={() => navigate('/early-access')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-base px-8 py-4 rounded-xl transition-colors shadow-lg flex items-center gap-2"
        >
          Get Early Access <ChevronRight className="h-5 w-5" />
        </button>
        <p className="text-blue-300 text-xs mt-4">Free during beta · No credit card required</p>
      </section>

      {/* ── Value strip ─────────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-10 -mt-10 rounded-t-3xl">
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          {[
            { icon: <TrendingUp className="h-5 w-5 text-[#1e3a5f]" />, label: 'Built for rowing' },
            { icon: <Users className="h-5 w-5 text-[#1e3a5f]" />, label: 'Coach + athlete views' },
            { icon: <Zap className="h-5 w-5 text-[#1e3a5f]" />, label: 'Real-time insights' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 text-center">
              <div className="bg-[#1e3a5f]/10 rounded-xl p-2">{icon}</div>
              <p className="text-xs font-semibold text-slate-700 leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-10">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest text-center mb-2">What you get</p>
          <h2 className="text-2xl font-black text-slate-900 text-center mb-8">Everything your program needs</h2>

          <div className="space-y-4">
            {[
              {
                icon: <CalendarDays className="h-6 w-6 text-[#1e3a5f]" />,
                title: 'Training Calendar',
                desc: 'Coaches plan erg, water, weights, and rest sessions. Athletes see exactly what\'s coming and what\'s expected of them — day by day.',
              },
              {
                icon: <HeartPulse className="h-6 w-6 text-[#1e3a5f]" />,
                title: 'Wellness Check-ins',
                desc: 'Morning readiness, post-session RPE, and evening recovery logs. All data goes straight to your coach so nothing slips through the cracks.',
              },
              {
                icon: <BellRing className="h-6 w-6 text-[#1e3a5f]" />,
                title: 'Coach Alerts',
                desc: 'Automatic flags when athletes show soreness streaks, low sleep patterns, or upcoming exam stress — so coaches can act before problems escalate.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-4">
                <div className="bg-[#1e3a5f]/10 rounded-xl p-3 flex-shrink-0 h-fit">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="bg-white px-6 py-12">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest text-center mb-2">Simple by design</p>
          <h2 className="text-2xl font-black text-slate-900 text-center mb-10">How it works</h2>

          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Athletes check in',
                desc: 'Quick morning and post-session surveys take under 60 seconds. How\'s your sleep? Your soreness? Your readiness?',
              },
              {
                step: '02',
                title: 'Coaches review the data',
                desc: 'The dashboard surfaces alerts, wellness trends, and session completion — all in one place, updated in real time.',
              },
              {
                step: '03',
                title: 'Train smarter together',
                desc: 'Use data to adjust training loads, catch injuries early, and have better conversations between coach and athlete.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#1e3a5f] flex items-center justify-center">
                  <span className="text-white font-black text-sm">{step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────── */}
      <section className="px-6 py-10 bg-slate-50">
        <div className="max-w-lg mx-auto bg-gradient-to-br from-[#0f2d52] via-[#1e3a5f] to-[#2d5a8e] rounded-2xl p-8 text-center shadow-lg">
          <Waves className="h-8 w-8 text-orange-400 mx-auto mb-4" strokeWidth={2} />
          <h2 className="text-white font-black text-2xl mb-2">Join the waitlist</h2>
          <p className="text-blue-200 text-sm mb-6 leading-relaxed">
            RowIQ is currently in early access. Get in now and help shape the future of rowing performance.
          </p>
          <button
            onClick={() => navigate('/early-access')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-md w-full flex items-center justify-center gap-2"
          >
            Get Early Access <ChevronRight className="h-5 w-5" />
          </button>
          <p className="text-blue-300 text-xs mt-3">Takes 60 seconds · Free during beta</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-[#0f2d52] px-6 py-8 mt-auto">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-orange-400" strokeWidth={2.5} />
            <span className="text-white font-black text-lg tracking-tight">RowIQ</span>
          </div>
          <p className="text-blue-300 text-xs text-center">Train smarter. Row faster.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-300 hover:text-white text-xs transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/early-access')}
              className="text-blue-300 hover:text-white text-xs transition-colors"
            >
              Early Access
            </button>
          </div>
          <p className="text-blue-400 text-xs">© {new Date().getFullYear()} RowIQ. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
