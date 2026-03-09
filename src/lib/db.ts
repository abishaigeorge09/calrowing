import { supabase } from '@/lib/supabase'

/**
 * Single source of truth for Supabase availability.
 * When false → demo mode (mock data, no network calls).
 * When true  → real Supabase reads/writes.
 */
export const IS_SUPABASE = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
)

/**
 * Typed query helper — unwraps the Supabase response and throws a
 * structured error (with .status) on failure so React Query's retry
 * logic can decide whether to retry 4xx errors.
 */
export async function dbQuery<T>(
  fn: () => Promise<{ data: T | null; error: { message: string; status?: number } | null }>
): Promise<T> {
  const { data, error } = await fn()
  if (error) {
    const err = new Error(error.message) as Error & { status?: number }
    err.status = error.status
    throw err
  }
  if (data === null) throw new Error('No data returned')
  return data
}

export { supabase }
