/**
 * survey-scheduler Edge Function
 *
 * Runs every 30 minutes (via pg_cron or external scheduler).
 * Checks which athletes need check-in reminders based on current time,
 * inserts notification records, and optionally sends Web Push notifications.
 *
 * Time windows (UTC — adjust TIMEZONE_OFFSET for your team's location):
 *   Morning:      06:30–07:15 UTC  →  remind athletes who haven't done morning check-in
 *   Post-session: Check after sessions end (scheduled time + duration + 30 min buffer)
 *   Evening:      21:00–21:30 UTC  →  remind athletes who haven't done evening log
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY    = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY   = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT       = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@rowiq.app'

// UTC offset for the team (e.g., -5 for US Eastern Standard Time)
// In practice you'd store this per-team. For now, use Eastern time.
const TIMEZONE_OFFSET_HOURS = -5

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Helpers ───────────────────────────────────────────────────────────────────

function localHour(): number {
  const utcHour = new Date().getUTCHours()
  return ((utcHour + TIMEZONE_OFFSET_HOURS) + 24) % 24
}

function todayDate(): string {
  // Today in UTC (close enough for daily check-ins)
  return new Date().toISOString().split('T')[0]
}

async function getAthletesMissingMorning(): Promise<Array<{ id: string; name: string }>> {
  const today = todayDate()
  const { data, error } = await supabase.rpc('athletes_missing_morning', { target_date: today })
  if (error) {
    // Fallback: direct query
    const result = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'athlete')
      .not('team_id', 'is', null)

    if (result.error) return []
    const allAthletes = result.data ?? []

    // Filter out those who already checked in
    const logsResult = await supabase
      .from('wellness_logs')
      .select('athlete_id')
      .eq('log_type', 'morning')
      .gte('created_at', `${today}T00:00:00Z`)

    const checkedIn = new Set((logsResult.data ?? []).map((l: { athlete_id: string }) => l.athlete_id))

    // Filter out those who already got a morning reminder today
    const notifResult = await supabase
      .from('notifications')
      .select('user_id')
      .eq('type', 'morning_reminder')
      .gte('created_at', `${today}T00:00:00Z`)

    const alreadyNotified = new Set((notifResult.data ?? []).map((n: { user_id: string }) => n.user_id))

    return allAthletes.filter(
      (a: { id: string; name: string }) => !checkedIn.has(a.id) && !alreadyNotified.has(a.id)
    )
  }
  return data ?? []
}

async function getAthletesMissingEvening(): Promise<Array<{ id: string; name: string }>> {
  const today = todayDate()

  // Get athletes who did a morning log today
  const morningResult = await supabase
    .from('wellness_logs')
    .select('athlete_id, profiles!athlete_id(id, name)')
    .eq('log_type', 'morning')
    .gte('created_at', `${today}T00:00:00Z`)

  if (morningResult.error) return []

  const didMorning = (morningResult.data ?? []).map((r: { profiles: { id: string; name: string } | null }) => r.profiles).filter(Boolean)

  // Filter out those who already did evening log
  const eveningResult = await supabase
    .from('wellness_logs')
    .select('athlete_id')
    .eq('log_type', 'evening')
    .gte('created_at', `${today}T00:00:00Z`)

  const didEvening = new Set((eveningResult.data ?? []).map((l: { athlete_id: string }) => l.athlete_id))

  // Filter out those already notified for evening today
  const notifResult = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', 'evening_reminder')
    .gte('created_at', `${today}T00:00:00Z`)

  const alreadyNotified = new Set((notifResult.data ?? []).map((n: { user_id: string }) => n.user_id))

  return (didMorning as Array<{ id: string; name: string }>).filter(
    a => !didEvening.has(a.id) && !alreadyNotified.has(a.id)
  )
}

async function insertNotification(params: {
  userId: string
  type: string
  title: string
  body: string
  actionUrl: string
}) {
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    action_url: params.actionUrl,
  })
}

async function sendPushToUser(userId: string, payload: { title: string; body: string; action_url: string; type: string }) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  for (const sub of subs ?? []) {
    try {
      // Build the Web Push request using the Web Push protocol
      // In a real implementation, use a web-push Deno library
      // For MVP, the notification record itself is sufficient for in-app display
      // Push delivery requires a full web-push implementation (webpush-libs/webpush-deno)
      // TODO: Implement full web push with VAPID when VAPID keys are configured
      console.log(`[push] Would send to ${sub.endpoint} for user ${userId}`, payload)
    } catch (err) {
      // If subscription is gone, clean it up
      await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      console.error(`[push] Removed stale subscription for user ${userId}:`, err)
    }
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow manual invocations (POST) and cron triggers
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const hour = localHour()
  const results: string[] = []

  // ── Morning Reminder: 6:30am–7:30am local time ───────────────────────────
  if (hour >= 6 && hour < 8) {
    const athletes = await getAthletesMissingMorning()
    for (const athlete of athletes) {
      await insertNotification({
        userId: athlete.id,
        type: 'morning_reminder',
        title: '🌅 Morning Check-in Ready',
        body: 'Start your day right — log your sleep, energy, and soreness (90 sec)',
        actionUrl: '/athlete',
      })
      await sendPushToUser(athlete.id, {
        title: '🌅 Morning Check-in Ready',
        body: 'Start your day right — log your sleep, energy, and soreness',
        action_url: '/athlete',
        type: 'morning_reminder',
      })
    }
    results.push(`morning: notified ${athletes.length} athletes`)
  }

  // ── Evening Reminder: 9:00pm–9:30pm local time ───────────────────────────
  if (hour >= 21 && hour < 22) {
    const athletes = await getAthletesMissingEvening()
    for (const athlete of athletes) {
      await insertNotification({
        userId: athlete.id,
        type: 'evening_reminder',
        title: '🌙 Evening Log',
        body: 'Quick wrap-up: nutrition, hydration, and sleep goal (60 sec)',
        actionUrl: '/athlete',
      })
      await sendPushToUser(athlete.id, {
        title: '🌙 Evening Log',
        body: 'Quick wrap-up: nutrition, hydration, and sleep goal',
        action_url: '/athlete',
        type: 'evening_reminder',
      })
    }
    results.push(`evening: notified ${athletes.length} athletes`)
  }

  // ── Post-Session Reminder: check for sessions that ended 30+ min ago ─────
  // (runs any time of day — checks sessions with matching date)
  {
    const today = todayDate()
    const nowMinutes = (new Date().getUTCHours() + TIMEZONE_OFFSET_HOURS) * 60 + new Date().getUTCMinutes()

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, team_id, duration, type')
      .eq('date', today)
      .neq('type', 'Rest')

    for (const session of sessions ?? []) {
      // Estimate session start as 6am local = 360 minutes
      const estimatedStartMin = 360 // 6:00am — in production, store actual start time
      const estimatedEndMin = estimatedStartMin + (session.duration ?? 90) + 30 // +30 buffer

      if (nowMinutes < estimatedEndMin) continue // Session hasn't ended yet

      // Get athletes on this team who haven't done post-session log
      const { data: athletes } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('team_id', session.team_id)
        .eq('role', 'athlete')

      for (const athlete of athletes ?? []) {
        // Check if they already logged post-session
        const { data: existing } = await supabase
          .from('wellness_logs')
          .select('id')
          .eq('athlete_id', athlete.id)
          .eq('log_type', 'post')
          .gte('created_at', `${today}T00:00:00Z`)
          .limit(1)

        if (existing && existing.length > 0) continue

        // Check if already notified
        const { data: notified } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', athlete.id)
          .eq('type', 'post_session_reminder')
          .gte('created_at', `${today}T00:00:00Z`)
          .limit(1)

        if (notified && notified.length > 0) continue

        await insertNotification({
          userId: athlete.id,
          type: 'post_session_reminder',
          title: '💪 Post-Session Check-in',
          body: `How did the ${session.type} session feel? Log RPE, fatigue, and recovery (2 min)`,
          actionUrl: '/athlete',
        })
        await sendPushToUser(athlete.id, {
          title: '💪 Post-Session Check-in',
          body: `Log your ${session.type} session: RPE, fatigue, and recovery`,
          action_url: '/athlete',
          type: 'post_session_reminder',
        })
      }
      results.push(`post-session: checked ${session.type} session`)
    }
  }

  return new Response(
    JSON.stringify({ success: true, timestamp: new Date().toISOString(), results }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
