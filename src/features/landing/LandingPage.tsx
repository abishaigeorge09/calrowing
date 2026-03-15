import { useNavigate } from 'react-router-dom'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { motion } from 'framer-motion'
import {
  Hexagon,
  CalendarDays,
  HeartPulse,
  BellRing,
  ChevronRight,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import * as THREE from 'three'

// Starfield Background Component
function Starfield(props: any) {
  const ref = useRef<any>(null)
  
  const sphere = useMemo(() => {
    // Generate random points in a sphere shell
    const coords = new Float32Array(3000)
    for (let i = 0; i < 3000; i += 3) {
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = 3 + Math.random() * 2 // radius between 3 and 5
      coords[i] = r * Math.sin(phi) * Math.cos(theta)
      coords[i+1] = r * Math.sin(phi) * Math.sin(theta)
      coords[i+2] = r * Math.cos(phi)
    }
    return coords
  }, [])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 30
      ref.current.rotation.y -= delta / 40
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#ffffff" size={0.015} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
      </Points>
    </group>
  )
}

function FloatingGeometry() {
  const ref = useRef<any>(null)
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.1
      ref.current.rotation.y += delta * 0.15
    }
  })
  
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <icosahedronGeometry args={[2.5, 1]} />
      <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
    </mesh>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-dvh bg-black text-white font-sans overflow-hidden">
      
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <Starfield />
          <FloatingGeometry />
        </Canvas>
      </div>

      {/* Content wrapper with scroll */}
      <div className="relative z-10 h-dvh overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col min-h-full">
          {/* Nav */}
          <nav className="px-6 py-5 flex items-center justify-between sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-3">
              <Hexagon className="h-7 w-7 text-white" strokeWidth={1.5} />
              <span className="font-bold text-xl tracking-widest uppercase">RowIQ</span>
            </div>
            <button
              onClick={() => navigate('/early-access')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all backdrop-blur-md"
            >
              Early Access
            </button>
          </nav>

          {/* Hero */}
          <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center min-h-[80vh]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="max-w-3xl mx-auto flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
                <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase">Live Everywhere</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-br from-white via-gray-300 to-gray-600 bg-clip-text text-transparent">
                Elevate Your <br />Performance
              </h1>
              
              <p className="text-gray-400 text-lg md:text-xl max-w-xl leading-relaxed mb-10 font-light">
                The next-generation platform for competitive rowing. Connect data, optimize training, and dominate the water with precision insights.
              </p>
              
              <button
                onClick={() => navigate('/early-access')}
                className="group relative px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </motion.div>
          </section>

          {/* Value Strip */}
          <section className="px-6 py-12 border-y border-white/5 bg-black/40 backdrop-blur-md z-10 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: <TrendingUp className="h-6 w-6" />, label: 'Advanced Tracking' },
                { icon: <Users className="h-6 w-6" />, label: 'Team Rosters' },
                { icon: <Zap className="h-6 w-6" />, label: 'Real-time Stats' },
              ].map(({ icon, label }, i) => (
                <motion.div 
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="flex flex-col items-center gap-4 text-center p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="p-3 bg-white/10 rounded-2xl text-white">
                    {icon}
                  </div>
                  <p className="text-xs font-bold tracking-widest text-gray-300 uppercase">{label}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className="px-6 py-32 z-10 relative">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                <p className="text-xs font-bold tracking-widest text-white/50 uppercase mb-3">Core Features</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Everything You Need</h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <CalendarDays className="h-6 w-6 text-white" />,
                    title: 'Smart Scheduling',
                    desc: 'Precision training calendars for athletes. Synchronize erg, water, and recovery effortlessly across your entire roster.',
                  },
                  {
                    icon: <HeartPulse className="h-6 w-6 text-white" />,
                    title: 'Biometric Monitoring',
                    desc: 'Daily readiness and RPE logs. Turn subjective feelings into objective, actionable recovery metrics in seconds.',
                  },
                  {
                    icon: <BellRing className="h-6 w-6 text-white" />,
                    title: 'Predictive Alerts',
                    desc: 'Automated warnings for fatigue and injury patterns before they impact performance. Stay ahead of the curve.',
                  },
                ].map(({ icon, title, desc }, i) => (
                  <motion.div 
                    key={title} 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.15, duration: 0.6 }}
                    className="group relative bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                    <div className="bg-white/10 rounded-2xl p-4 w-fit mb-6 ring-1 ring-white/20 group-hover:ring-white/40 group-hover:scale-110 transition-all duration-300 relative z-10">
                      {icon}
                    </div>
                    <h3 className="font-bold text-xl mb-3 tracking-wide">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed font-light">{desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-6 py-32 bg-black border-t border-white/5 relative overflow-hidden z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="max-w-4xl mx-auto text-center relative z-10 p-12 md:p-20 rounded-[3rem] border border-white/10 bg-black/60 backdrop-blur-2xl">
              <Hexagon className="h-16 w-16 text-white mx-auto mb-8 opacity-80" strokeWidth={1} />
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Ready to Win?</h2>
              <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto font-light leading-relaxed">
                Join the exclusive early access tier to give your team a tactical advantage and dominate the competition.
              </p>
              <button
                onClick={() => navigate('/early-access')}
                className="bg-white text-black font-bold uppercase tracking-widest text-sm px-12 py-5 rounded-full hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-300"
              >
                Request Access Now
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-10 border-t border-white/5 bg-black text-center text-xs text-gray-500 z-10 relative">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Hexagon className="h-4 w-4" />
              <span className="font-bold tracking-widest uppercase text-gray-400">RowIQ © {new Date().getFullYear()}</span>
            </div>
            <div className="flex justify-center gap-8 mb-6 uppercase tracking-widest font-semibold text-[10px]">
              <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Sign In</button>
              <button onClick={() => navigate('/early-access')} className="hover:text-white transition-colors">Early Access</button>
            </div>
            <p className="font-light tracking-wide">Engineered for the future of rowing.</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
