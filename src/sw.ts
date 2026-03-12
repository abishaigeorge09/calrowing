/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Runtime caching for Supabase API calls (NetworkFirst, 5 min cache)
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-cache',
    plugins: [],
  })
)

// ─── Web Push Notification Handler ───────────────────────────────────────────

self.addEventListener('push', (event: PushEvent) => {
  let payload: {
    title?: string
    body?: string
    action_url?: string
    type?: string
  } = {}

  try {
    payload = event.data?.json() ?? {}
  } catch {
    payload = { title: 'RowIQ', body: event.data?.text() ?? 'Time to check in!' }
  }

  const title = payload.title ?? 'RowIQ'
  // Use type assertion to include service worker-specific notification options
  // (actions, badge etc. are valid in SW context but not in lib.dom types)
  const options = {
    body: payload.body ?? 'You have a new notification.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.type ?? 'rowiq-notification',
    data: {
      actionUrl: payload.action_url ?? '/athlete',
      type: payload.type,
    },
    actions: [
      { action: 'open', title: 'Open RowIQ' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  } as NotificationOptions

  event.waitUntil(self.registration.showNotification(title, options))
})

// ─── Notification Click Handler ───────────────────────────────────────────────

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const actionUrl: string = event.notification.data?.actionUrl ?? '/athlete'

  event.waitUntil(
    (self.clients as Clients).matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          ;(client as WindowClient).navigate(actionUrl)
          return client.focus()
        }
      }
      // Otherwise open a new window
      if ('openWindow' in self.clients) {
        return (self.clients as Clients).openWindow(actionUrl)
      }
    })
  )
})
