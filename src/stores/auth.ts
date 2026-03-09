import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types/database'
import { DEMO_ACCOUNTS, MOCK_TEAM } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: Profile | null
  isLoading: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => void
}

const SUPABASE_AVAILABLE = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
)

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isDemoMode: !SUPABASE_AVAILABLE,

      signIn: async (email, password) => {
        set({ isLoading: true })

        // Demo mode: check local accounts
        if (!SUPABASE_AVAILABLE) {
          const account = DEMO_ACCOUNTS[email.toLowerCase()]
          if (account && account.password === password) {
            set({ user: account.profile, isLoading: false })
            return {}
          }
          set({ isLoading: false })
          return { error: 'Invalid email or password' }
        }

        // Real Supabase auth
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          set({ isLoading: false })
          return { error: error.message }
        }
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          set({ user: profile, isLoading: false })
        }
        return {}
      },

      signOut: async () => {
        if (SUPABASE_AVAILABLE) await supabase.auth.signOut()
        set({ user: null })
      },

      updateProfile: (updates) => {
        const user = get().user
        if (user) set({ user: { ...user, ...updates } })
      },
    }),
    {
      name: 'rowiq-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// Team data helper
export { MOCK_TEAM }
