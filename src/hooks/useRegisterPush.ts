import { useEffect, useRef } from 'react'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { useAuthStore } from '@/stores/auth'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/**
 * Registers a Web Push subscription for the current user.
 * - Checks for browser push support + service worker registration
 * - Requests notification permission (shows browser dialog)
 * - Subscribes with the app's VAPID public key
 * - Stores the subscription in Supabase push_subscriptions table
 * - Idempotent: uses UPSERT so it's safe to call multiple times
 *
 * Call this hook from the athlete's Today screen or main layout.
 * It only runs once per device/user session (tracked via ref).
 */
export function useRegisterPush() {
  const { user } = useAuthStore()
  const attempted = useRef(false)

  useEffect(() => {
    // Only run once per session, only in Supabase mode, only for athletes
    if (attempted.current) return
    if (!IS_SUPABASE || !user?.id) return
    if (!VAPID_PUBLIC_KEY) return // Push not configured
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    attempted.current = true

    const register = async () => {
      try {
        // Get the active service worker registration
        const registration = await navigator.serviceWorker.ready

        // Check current permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        // Subscribe to push (pass VAPID key as base64url string)
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        })

        const json = subscription.toJSON()
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return

        // Store subscription in Supabase (UPSERT on endpoint uniqueness)
        await supabase.from('push_subscriptions').upsert(
          {
            user_id: user.id,
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth_key: json.keys.auth,
          },
          { onConflict: 'user_id,endpoint' }
        )
      } catch (_err) {
        // Silently fail — push is a nice-to-have, not critical
      }
    }

    register()
  }, [user?.id])
}

