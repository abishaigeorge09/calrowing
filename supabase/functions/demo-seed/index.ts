/**
 * demo-seed Edge Function
 *
 * Creates or ensures all 9 RowIQ demo accounts exist in Supabase Auth,
 * then seeds the database with realistic 14-day wellness data.
 *
 * Idempotent: safe to run multiple times. Uses upsert/on-conflict semantics.
 *
 * Invoke:
 *   supabase functions invoke demo-seed --no-verify-jwt
 *
 * Requires: Service Role Key (SUPABASE_SERVICE_ROLE_KEY secret)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DEMO_PASSWORD        = 'Demo1234!'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Demo Account Definitions ──────────────────────────────────────────────────

const DEMO_USERS = [
  { email: 'coach@rowiq.demo',  name: 'Coach Demo',     role: 'coach'   },
  { email: 'alex@rowiq.demo',   name: 'Alex Chen',      role: 'athlete' },
  { email: 'jordan@rowiq.demo', name: 'Jordan Rivera',  role: 'athlete' },
  { email: 'sam@rowiq.demo',    name: 'Sam Park',       role: 'athlete' },
  { email: 'taylor@rowiq.demo', name: 'Taylor Kim',     role: 'athlete' },
  { email: 'morgan@rowiq.demo', name: 'Morgan Walsh',   role: 'athlete' },
  { email: 'casey@rowiq.demo',  name: 'Casey Liu',      role: 'athlete' },
  { email: 'riley@rowiq.demo',  name: 'Riley Torres',   role: 'athlete' },
  { email: 'jamie@rowiq.demo',  name: 'Jamie Scott',    role: 'athlete' },
]

const ATHLETE_PROFILES: Record<string, {
  year: string; boat_class: string; seat_position: string
  height_cm: number; weight_kg: number; sleep_goal: number; injuries_text: string | null
}> = {
  'alex@rowiq.demo':   { year: 'Junior',    boat_class: 'Varsity 8', seat_position: 'Stroke', height_cm: 193, weight_kg: 86, sleep_goal: 8, injuries_text: 'Lower back tightness (recurring)' },
  'jordan@rowiq.demo': { year: 'Senior',    boat_class: 'Varsity 8', seat_position: '2-seat', height_cm: 188, weight_kg: 82, sleep_goal: 8, injuries_text: null },
  'sam@rowiq.demo':    { year: 'Sophomore', boat_class: 'Varsity 8', seat_position: '3-seat', height_cm: 185, weight_kg: 79, sleep_goal: 8, injuries_text: null },
  'taylor@rowiq.demo': { year: 'Junior',    boat_class: 'JV 8',      seat_position: 'Stroke', height_cm: 187, weight_kg: 80, sleep_goal: 8, injuries_text: null },
  'morgan@rowiq.demo': { year: 'Freshman',  boat_class: 'JV 8',      seat_position: '2-seat', height_cm: 183, weight_kg: 77, sleep_goal: 8, injuries_text: null },
  'casey@rowiq.demo':  { year: 'Senior',    boat_class: 'Varsity 8', seat_position: 'Cox',    height_cm: 165, weight_kg: 55, sleep_goal: 7, injuries_text: null },
  'riley@rowiq.demo':  { year: 'Junior',    boat_class: 'Varsity 8', seat_position: '4-seat', height_cm: 190, weight_kg: 84, sleep_goal: 8, injuries_text: null },
  'jamie@rowiq.demo':  { year: 'Sophomore', boat_class: 'JV 8',      seat_position: '3-seat', height_cm: 186, weight_kg: 78, sleep_goal: 8, injuries_text: null },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureUser(email: string, name: string, role: string): Promise<string> {
  // Try to find existing user by email
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 })
  const existing = list?.users?.find(u => u.email === email)
  if (existing) return existing.id

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (error) throw new Error(`Failed to create ${email}: ${error.message}`)
  return data.user.id
}

function dateStr(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

function morningData(email: string, dayIndex: number): Record<string, unknown> {
  const isAlex   = email === 'alex@rowiq.demo'
  const isJordan = email === 'jordan@rowiq.demo'
  const isSam    = email === 'sam@rowiq.demo'

  return {
    sleep_hours:        isJordan ? 5.5 : isAlex ? 7.5 : 7 + (dayIndex % 3) * 0.5,
    sleep_quality:      isJordan ? 2 : 3,
    energy:             isJordan ? 2 : 3,
    has_soreness:       isAlex && dayIndex > 4,
    soreness_body_part: isAlex && dayIndex > 4 ? 'Lower Back' : null,
    soreness_level:     isAlex && dayIndex > 4 ? 3 : null,
    stress:             isSam ? 4 : 2,
    motivation:         3,
    classes_today:      2,
    assignments_due:    false,
    exam_this_week:     isSam,
  }
}

function postData(email: string, dayIndex: number): Record<string, unknown> {
  const isAlex   = email === 'alex@rowiq.demo'
  const isJordan = email === 'jordan@rowiq.demo'

  return {
    completion:       dayIndex % 7 === 3 ? 'partial' : 'full',
    rpe:              isJordan ? 8 : 5 + (dayIndex % 4),
    legs_fatigue:     3,
    back_core_fatigue: isAlex ? 4 : 2,
    breathing_difficulty: 3,
    has_pain:         isAlex && dayIndex > 4,
    pain_body_part:   isAlex && dayIndex > 4 ? 'Lower Back' : null,
    pain_level:       isAlex && dayIndex > 4 ? 3 : null,
    hit_target_splits: dayIndex % 3 === 0 ? 'yes' : 'close',
    recovery_status:  3,
    ready_tomorrow:   isJordan ? 'maybe' : 'yes',
    studying_tonight: false,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Send a POST request to seed demo data', { status: 405 })
  }

  const log: string[] = []

  try {
    // Step 1: Ensure all users exist and collect IDs
    const ids: Record<string, string> = {}
    for (const u of DEMO_USERS) {
      ids[u.email] = await ensureUser(u.email, u.name, u.role)
      log.push(`✓ user: ${u.email} → ${ids[u.email]}`)
    }

    const coachId = ids['coach@rowiq.demo']

    // Step 2: Update profiles (trigger creates them; we update name/role/team)
    // First create team if needed
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('invite_code', 'CAL-ROW-2026')
      .single()

    let teamId: string
    if (existingTeam) {
      teamId = existingTeam.id
      log.push(`✓ team exists: ${teamId}`)
    } else {
      const { data: newTeam, error: teamErr } = await supabase
        .from('teams')
        .insert({
          name: "Demo Rowing Club",
          invite_code: 'CAL-ROW-2026',
          sport: 'Rowing',
          division: 'Demo',
          season_start: '2025-09-01',
          season_end: '2026-06-01',
          coach_id: coachId,
        })
        .select('id')
        .single()
      if (teamErr) throw teamErr
      teamId = newTeam!.id
      log.push(`✓ team created: ${teamId}`)
    }

    // Update all profiles with name, role, team
    for (const u of DEMO_USERS) {
      await supabase.from('profiles').upsert({
        id: ids[u.email],
        name: u.name,
        role: u.role,
        team_id: teamId,
        email: u.email,
      }, { onConflict: 'id' })
    }
    log.push(`✓ profiles updated`)

    // Step 3: Athlete profiles
    for (const u of DEMO_USERS.filter(u => u.role === 'athlete')) {
      const ap = ATHLETE_PROFILES[u.email]
      await supabase.from('athletes').upsert({
        id: ids[u.email],
        ...ap,
      }, { onConflict: 'id' })
    }
    log.push(`✓ athlete profiles upserted`)

    // Step 4: Academic schedule for Sam
    await supabase.from('academic_schedules').upsert({
      athlete_id: ids['sam@rowiq.demo'],
      classes_per_day: 3,
      hard_days: ['Monday', 'Wednesday', 'Friday'],
      exam_weeks: [
        { week: dateStr(1), subject: 'Thermodynamics' },
        { week: dateStr(8), subject: 'Fluid Mechanics' },
      ],
    }, { onConflict: 'athlete_id' })
    log.push(`✓ academic schedule for Sam`)

    // Step 5: Sessions (14 total: past + today + future)
    const sessionTypes = [
      { offset: -7, type: 'Erg',           duration: 90,  intensity: 'High',      warmup: '10 min easy', main_set: '4x2000m @ 2:02/500m, r20', cooldown: '10 min easy', target_split: '2:02/500m', stroke_rate: 'r20', coach_notes: 'Key fitness test', is_notes_public: true },
      { offset: -6, type: 'Water',         duration: 120, intensity: 'Moderate',  warmup: '15 min easy', main_set: '3x5km steady state @ 18spm', cooldown: '10 min easy', target_split: '2:08/500m', stroke_rate: 'r18', coach_notes: null, is_notes_public: false },
      { offset: -5, type: 'Weights',       duration: 75,  intensity: 'High',      warmup: null, main_set: 'Deadlift 4x5, Back squat 4x5, Power clean 4x3', cooldown: null, target_split: null, stroke_rate: null, coach_notes: null, is_notes_public: false },
      { offset: -4, type: 'Rest',          duration: 0,   intensity: 'Low',       warmup: null, main_set: 'Full rest day', cooldown: null, target_split: null, stroke_rate: null, coach_notes: 'Get extra sleep tonight', is_notes_public: true },
      { offset: -3, type: 'Erg',           duration: 60,  intensity: 'Moderate',  warmup: '10 min easy', main_set: '3x20min @ 2:08/500m, r18', cooldown: '10 min easy', target_split: '2:08/500m', stroke_rate: 'r18', coach_notes: null, is_notes_public: false },
      { offset: -2, type: 'Water',         duration: 110, intensity: 'High',      warmup: '20 min easy', main_set: '2x6km race pace, 10 min rest', cooldown: '15 min easy', target_split: '1:58/500m', stroke_rate: 'r32', coach_notes: null, is_notes_public: false },
      { offset: -1, type: 'Erg',           duration: 90,  intensity: 'High',      warmup: '10 min easy', main_set: '4x2000m @ 2:02/500m, r20', cooldown: '10 min easy', target_split: '2:02/500m', stroke_rate: 'r20', coach_notes: null, is_notes_public: false },
      { offset: 0,  type: 'Erg',           duration: 90,  intensity: 'High',      warmup: '10 min at low rate, focus on catch timing', main_set: '4x2000m @ 2:02/500m, r20, 5 min rest between pieces', cooldown: '10 min easy rowing, stretching', target_split: '2:02/500m', stroke_rate: 'r20', coach_notes: 'This is a key fitness test. Trust your training.', is_notes_public: true },
      { offset: 1,  type: 'Water',         duration: 120, intensity: 'Moderate',  warmup: '15 min easy', main_set: '3x5km steady state @ 18spm', cooldown: '10 min easy', target_split: '2:08/500m', stroke_rate: 'r18', coach_notes: null, is_notes_public: false },
      { offset: 2,  type: 'Weights',       duration: 75,  intensity: 'High',      warmup: null, main_set: 'Deadlift 4x5, Back squat 4x5, Power clean 4x3', cooldown: null, target_split: null, stroke_rate: null, coach_notes: null, is_notes_public: false },
      { offset: 3,  type: 'Rest',          duration: 0,   intensity: 'Low',       warmup: null, main_set: 'Full rest day — focus on recovery and sleep', cooldown: null, target_split: null, stroke_rate: null, coach_notes: null, is_notes_public: false },
      { offset: 4,  type: 'Erg',           duration: 75,  intensity: 'Race Pace', warmup: '15 min easy', main_set: '3x1000m @ race pace, r34, full rest', cooldown: '10 min easy', target_split: '1:56/500m', stroke_rate: 'r34', coach_notes: null, is_notes_public: false },
      { offset: 5,  type: 'Water',         duration: 90,  intensity: 'Moderate',  warmup: '15 min easy', main_set: '4x4km @ 2:06/500m, r20', cooldown: '10 min easy', target_split: '2:06/500m', stroke_rate: 'r20', coach_notes: null, is_notes_public: false },
      { offset: 6,  type: 'Cross Training', duration: 60, intensity: 'Low',       warmup: null, main_set: 'Yoga + stretching + core', cooldown: null, target_split: null, stroke_rate: null, coach_notes: null, is_notes_public: false },
    ]

    for (const s of sessionTypes) {
      await supabase.from('sessions').upsert({
        team_id: teamId,
        date: dateStr(s.offset),
        type: s.type,
        duration: s.duration,
        intensity: s.intensity,
        warmup: s.warmup,
        main_set: s.main_set,
        cooldown: s.cooldown,
        target_split: s.target_split,
        stroke_rate: s.stroke_rate,
        hr_zone: null,
        assigned_to: 'all',
        coach_notes: s.coach_notes,
        is_notes_public: s.is_notes_public,
        created_by: coachId,
      }, { onConflict: 'team_id,date,type' })
    }
    log.push(`✓ sessions upserted (14 total)`)

    // Step 6: Wellness logs — 14 days for each athlete
    const athletes = DEMO_USERS.filter(u => u.role === 'athlete')
    let logCount = 0

    for (let i = 1; i <= 14; i++) {
      const logDate = dateStr(i - 14) // days -13 to 0
      const offset = i

      for (const athlete of athletes) {
        const athleteId = ids[athlete.email]

        // Morning log
        await supabase.from('wellness_logs').upsert({
          athlete_id: athleteId,
          log_type: 'morning',
          created_at: `${logDate}T07:15:00Z`,
          data: morningData(athlete.email, offset),
        }, { onConflict: 'athlete_id,log_type,created_at' })
        logCount++

        // Post-session log (past days only, skip rest days at offset 4,11)
        if (logDate < dateStr(0) && offset !== 4 && offset !== 11) {
          await supabase.from('wellness_logs').upsert({
            athlete_id: athleteId,
            log_type: 'post',
            created_at: `${logDate}T20:00:00Z`,
            data: postData(athlete.email, offset),
          }, { onConflict: 'athlete_id,log_type,created_at' })
          logCount++
        }
      }
    }
    log.push(`✓ wellness logs upserted (${logCount} total)`)

    // Step 7: Alerts
    await supabase.from('alerts').upsert([
      {
        athlete_id: ids['alex@rowiq.demo'],
        coach_id: coachId,
        type: 'soreness_streak',
        severity: 'high',
        data: { streak_days: 3, body_part: 'Lower Back' },
        reviewed_at: null,
      },
      {
        athlete_id: ids['jordan@rowiq.demo'],
        coach_id: coachId,
        type: 'low_sleep',
        severity: 'high',
        data: { sleep_hours: 5.5, session_intensity: 'High' },
        reviewed_at: null,
      },
      {
        athlete_id: ids['sam@rowiq.demo'],
        coach_id: coachId,
        type: 'exam_tomorrow',
        severity: 'medium',
        data: { exam_subject: 'Thermodynamics', stress_level: 4 },
        reviewed_at: null,
      },
    ], { onConflict: 'athlete_id,type,coach_id' })
    log.push(`✓ alerts upserted (3 total)`)

    // Step 8: Demo messages (realistic coach ↔ Alex thread)
    const alexId  = ids['alex@rowiq.demo']
    const now = new Date()
    const msg = (senderId: string, receiverId: string, content: string, minsAgo: number) => ({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      is_urgent: false,
      created_at: new Date(now.getTime() - minsAgo * 60 * 1000).toISOString(),
    })

    // Check if messages already exist to avoid duplicate thread
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('id')
      .or(`and(sender_id.eq.${alexId},receiver_id.eq.${coachId}),and(sender_id.eq.${coachId},receiver_id.eq.${alexId})`)
      .limit(1)

    if (!existingMsgs || existingMsgs.length === 0) {
      await supabase.from('messages').insert([
        msg(alexId,   coachId, "Coach, my lower back is really bothering me today. Should I modify the erg pieces?", 120),
        msg(coachId,  alexId,  "Thanks for flagging. Let's do 2 pieces at low intensity and see how it feels. Stop if it sharpens.", 90),
        msg(alexId,   coachId, "Done. 2 pieces felt manageable. Pain is a 2/10 now.", 45),
        msg(coachId,  alexId,  "Good. Ice it tonight. Skip the weights tomorrow and we'll reassess.", 30),
        msg(alexId,   coachId, "Thanks coach, will do 🙏", 15),
      ])
      log.push(`✓ demo messages created (Alex ↔ Coach thread)`)
    } else {
      log.push(`✓ demo messages already exist — skipped`)
    }

    // Step 9: Sam → Coach message about exam
    const samId = ids['sam@rowiq.demo']
    const { data: samMsgs } = await supabase
      .from('messages')
      .select('id')
      .or(`and(sender_id.eq.${samId},receiver_id.eq.${coachId}),and(sender_id.eq.${coachId},receiver_id.eq.${samId})`)
      .limit(1)

    if (!samMsgs || samMsgs.length === 0) {
      await supabase.from('messages').insert([
        msg(samId,    coachId, "I have a thermo exam on Friday. Can we talk about training intensity this week?", 180),
        msg(coachId,  samId,   "Absolutely. We'll keep intensity moderate this week — your academics always come first.", 160),
      ])
      log.push(`✓ demo messages created (Sam ↔ Coach thread)`)
    }

    return new Response(
      JSON.stringify({ success: true, log }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ success: false, error: message, log }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
