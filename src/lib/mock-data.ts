import type { Profile, Team, Athlete, Session, WellnessLog, Message, Alert } from '@/types/database'
import { localDateStr } from '@/lib/utils'

export const MOCK_TEAM: Team = {
  id: 'team-cal-2026',
  name: "UC Berkeley Men's Rowing",
  invite_code: 'CAL-ROW-2026',
  sport: 'Rowing',
  division: 'NCAA D1',
  season_start: '2026-01-15',
  season_end: '2026-06-01',
  coach_id: 'coach-1',
  created_at: '2026-01-10T00:00:00Z',
}

export const MOCK_COACH: Profile = {
  id: 'coach-1',
  email: 'coach@rowiq.demo',
  name: 'Mike Teti',
  role: 'coach',
  status: 'active',
  team_id: 'team-cal-2026',
  avatar_url: null,
  created_at: '2026-01-10T00:00:00Z',
}

export const MOCK_SUPERADMIN: Profile = {
  id: 'superadmin-1',
  email: 'admin@rowiq.demo',
  name: 'RowIQ Admin',
  role: 'superadmin',
  status: 'active',
  team_id: null,
  avatar_url: null,
  created_at: '2025-01-01T00:00:00Z',
}

export const MOCK_PENDING_COACHES: Array<{
  profile: Profile
  teamName: string
  division: string
}> = [
  {
    profile: {
      id: 'pending-1',
      email: 'schen@stanford.edu',
      name: 'Coach Sarah Chen',
      role: 'coach',
      status: 'pending',
      team_id: null,
      avatar_url: null,
      created_at: '2026-03-10T14:30:00Z',
    },
    teamName: "Stanford Women's Rowing",
    division: 'NCAA D1',
  },
  {
    profile: {
      id: 'pending-2',
      email: 'jsmith@mit.edu',
      name: 'Coach James Smith',
      role: 'coach',
      status: 'pending',
      team_id: null,
      avatar_url: null,
      created_at: '2026-03-12T09:15:00Z',
    },
    teamName: 'MIT Lightweight Crew',
    division: 'Club',
  },
]

export const MOCK_ATHLETES: Profile[] = [
  { id: 'athlete-1', email: 'alex@rowiq.demo',    name: 'Alex Chen',     role: 'athlete', status: 'active', team_id: 'team-cal-2026', avatar_url: null, created_at: '2026-01-15T00:00:00Z' },
  { id: 'athlete-2', email: 'jordan@rowiq.demo',  name: 'Jordan Rivera', role: 'athlete', status: 'active', team_id: 'team-cal-2026', avatar_url: null, created_at: '2026-01-15T00:00:00Z' },
  { id: 'athlete-3', email: 'sam@rowiq.demo',     name: 'Sam Park',      role: 'athlete', status: 'active', team_id: 'team-cal-2026', avatar_url: null, created_at: '2026-01-15T00:00:00Z' },
  { id: 'athlete-4', email: 'taylor@rowiq.demo',  name: 'Taylor Kim',    role: 'athlete', status: 'active', team_id: 'team-cal-2026', avatar_url: null, created_at: '2026-01-16T00:00:00Z' },
  { id: 'athlete-5', email: 'morgan@rowiq.demo',  name: 'Morgan Walsh',  role: 'athlete', status: 'active', team_id: 'team-cal-2026', avatar_url: null, created_at: '2026-01-16T00:00:00Z' },
  { id: 'athlete-6', email: 'casey@rowiq.demo',   name: 'Casey Liu',     role: 'athlete', status: 'active', team_id: 'team-cal-2026', avatar_url: null, created_at: '2026-01-17T00:00:00Z' },
  { id: 'athlete-7', email: 'riley@rowiq.demo',   name: 'Riley Torres',  role: 'athlete', status: 'active', team_id: 'team-cal-2026', avatar_url: null, created_at: '2026-01-17T00:00:00Z' },
  { id: 'athlete-8', email: 'jamie@rowiq.demo',   name: 'Jamie Scott',   role: 'athlete', status: 'active', team_id: 'team-cal-2026', avatar_url: null, created_at: '2026-01-18T00:00:00Z' },
]

const MOCK_CREATED = '2026-01-01T00:00:00.000Z'
export const MOCK_ATHLETE_PROFILES: Record<string, Athlete> = {
  'athlete-1': { id: 'athlete-1', year: 'Junior',    boat_class: 'Varsity 8', seat_position: 'Stroke', height_cm: 193, weight_kg: 86,   sleep_goal: 8, injuries_text: null,                          created_at: MOCK_CREATED },
  'athlete-2': { id: 'athlete-2', year: 'Senior',    boat_class: 'Varsity 8', seat_position: '2-seat', height_cm: 188, weight_kg: 84,   sleep_goal: 8, injuries_text: null,                          created_at: MOCK_CREATED },
  'athlete-3': { id: 'athlete-3', year: 'Sophomore', boat_class: 'Varsity 8', seat_position: '3-seat', height_cm: 190, weight_kg: 87,   sleep_goal: 7, injuries_text: 'Lower back soreness (chronic)', created_at: MOCK_CREATED },
  'athlete-4': { id: 'athlete-4', year: 'Junior',    boat_class: 'JV 8',      seat_position: 'Stroke', height_cm: 185, weight_kg: 80,   sleep_goal: 8, injuries_text: null,                          created_at: MOCK_CREATED },
  'athlete-5': { id: 'athlete-5', year: 'Freshman',  boat_class: 'JV 8',      seat_position: '2-seat', height_cm: 187, weight_kg: 82,   sleep_goal: 8, injuries_text: null,                          created_at: MOCK_CREATED },
  'athlete-6': { id: 'athlete-6', year: 'Senior',    boat_class: 'Varsity 8', seat_position: 'Cox',    height_cm: 168, weight_kg: 55,   sleep_goal: 7, injuries_text: null,                          created_at: MOCK_CREATED },
  'athlete-7': { id: 'athlete-7', year: 'Junior',    boat_class: 'Varsity 8', seat_position: '4-seat', height_cm: 191, weight_kg: 88,   sleep_goal: 8, injuries_text: null,                          created_at: MOCK_CREATED },
  'athlete-8': { id: 'athlete-8', year: 'Sophomore', boat_class: 'JV 8',      seat_position: '3-seat', height_cm: 186, weight_kg: 81,   sleep_goal: 8, injuries_text: null,                          created_at: MOCK_CREATED },
}

const today = new Date()
const d = (offset: number) => {
  const dt = new Date(today)
  dt.setDate(dt.getDate() + offset)
  return localDateStr(dt)
}

// Tracks demo-mode deleted session IDs so useSessions can filter them out
export const deletedSessionIds = new Set<string>()

export const MOCK_SESSIONS: Session[] = [
  {
    id: 'session-today', team_id: 'team-cal-2026', date: d(0), type: 'Erg',
    duration: 90, intensity: 'High', start_time: '09:00', end_time: '10:30',
    warmup: '10 min at low rate, focus on catch timing',
    main_set: '4x2000m @ 2:02/500m, r20, 5 min rest between pieces',
    cooldown: '10 min easy rowing, stretching',
    target_split: '2:02/500m', stroke_rate: 20, hr_zone: 'Zone 4-5',
    assigned_to: 'whole_team', coach_notes: 'This is a key fitness test. Trust your training.',
    is_notes_public: true, created_by: 'coach-1', media_urls: [],
    created_at: new Date(today.getTime() - 86400000).toISOString(),
    updated_at: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'session-tomorrow', team_id: 'team-cal-2026', date: d(1), type: 'Water',
    duration: 120, intensity: 'Moderate', start_time: '07:00', end_time: '09:00',
    warmup: '15 min paddling, focus on blade work',
    main_set: '3x5km steady state @ 18spm, focus on ratio and run',
    cooldown: '10 min paddling, boat wash-down',
    target_split: '2:10/500m', stroke_rate: 18, hr_zone: 'Zone 2-3',
    assigned_to: 'whole_team', coach_notes: 'Technique focus — ratio over power today.',
    is_notes_public: true, created_by: 'coach-1', media_urls: [
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Ratio drill example', type: 'video' }
    ],
    created_at: new Date(today.getTime() - 86400000).toISOString(),
    updated_at: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'session-2', team_id: 'team-cal-2026', date: d(2), type: 'Weights',
    duration: 75, intensity: 'High', start_time: '06:30', end_time: '07:45',
    warmup: 'Dynamic stretching, light activation sets',
    main_set: 'Deadlift 4x5, Back squat 4x5, Power clean 4x3, Single-leg RDL 3x8',
    cooldown: 'Foam roll, static stretch',
    target_split: null, stroke_rate: null, hr_zone: null,
    assigned_to: 'whole_team', coach_notes: null, is_notes_public: false,
    created_by: 'coach-1', media_urls: [],
    created_at: new Date(today.getTime() - 86400000).toISOString(),
    updated_at: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'session-3', team_id: 'team-cal-2026', date: d(3), type: 'Rest',
    duration: 0, intensity: 'Low', start_time: undefined, end_time: undefined,
    warmup: '', main_set: 'Full rest day — focus on recovery and sleep',
    cooldown: '', target_split: null, stroke_rate: null, hr_zone: null,
    assigned_to: 'whole_team', coach_notes: 'Rest day. Eat well, hydrate, sleep 8+ hours.',
    is_notes_public: true, created_by: 'coach-1', media_urls: [],
    created_at: new Date(today.getTime() - 86400000).toISOString(),
    updated_at: new Date(today.getTime() - 86400000).toISOString(),
  },
  {
    id: 'session-past-1', team_id: 'team-cal-2026', date: d(-1), type: 'Erg',
    duration: 60, intensity: 'Moderate', start_time: '09:00', end_time: '10:00',
    warmup: '10 min easy',
    main_set: '3x20min @ 2:08/500m, r18, HR zone 3',
    cooldown: '5 min easy',
    target_split: '2:08/500m', stroke_rate: 18, hr_zone: 'Zone 3',
    assigned_to: 'whole_team', coach_notes: null, is_notes_public: false,
    created_by: 'coach-1', media_urls: [],
    created_at: new Date(today.getTime() - 2 * 86400000).toISOString(),
    updated_at: new Date(today.getTime() - 2 * 86400000).toISOString(),
  },
  {
    id: 'session-past-2', team_id: 'team-cal-2026', date: d(-2), type: 'Water',
    duration: 90, intensity: 'Low', start_time: '07:00', end_time: '08:30',
    warmup: '15 min paddling', main_set: '10km steady state, r18, ratio focus', cooldown: '10 min easy',
    target_split: '2:15/500m', stroke_rate: 18, hr_zone: 'Zone 2',
    assigned_to: 'whole_team', coach_notes: null, is_notes_public: false,
    created_by: 'coach-1', media_urls: [],
    created_at: new Date(today.getTime() - 3 * 86400000).toISOString(),
    updated_at: new Date(today.getTime() - 3 * 86400000).toISOString(),
  },
  {
    id: 'session-past-3', team_id: 'team-cal-2026', date: d(-3), type: 'Weights',
    duration: 75, intensity: 'High', start_time: '06:30', end_time: '07:45',
    warmup: 'Dynamic warm-up', main_set: 'Back squat 4x5@85%, RDL 4x6, Pull-ups 4x8', cooldown: 'Stretch',
    target_split: null, stroke_rate: null, hr_zone: null,
    assigned_to: 'whole_team', coach_notes: null, is_notes_public: false,
    created_by: 'coach-1', media_urls: [],
    created_at: new Date(today.getTime() - 4 * 86400000).toISOString(),
    updated_at: new Date(today.getTime() - 4 * 86400000).toISOString(),
  },
]

// Generate 14 days of wellness logs for each athlete
export const MOCK_WELLNESS_LOGS: WellnessLog[] = []
const athleteIds = ['athlete-1', 'athlete-2', 'athlete-3', 'athlete-4', 'athlete-5', 'athlete-6', 'athlete-7', 'athlete-8']

athleteIds.forEach((athleteId, aIdx) => {
  for (let dayOffset = -13; dayOffset <= 0; dayOffset++) {
    const dt = new Date(today)
    dt.setDate(dt.getDate() + dayOffset)
    const dateStr = localDateStr(dt)

    // Morning check-in
    const sleepHours = aIdx === 1 && dayOffset === 0 ? 5.5 :  // Jordan's red flag
                       aIdx === 1 && dayOffset === -1 ? 5.0 :
                       6 + Math.random() * 2.5
    MOCK_WELLNESS_LOGS.push({
      id: `log-morning-${athleteId}-${dayOffset}`,
      athlete_id: athleteId,
      session_id: null,
      log_type: 'morning',
      data: {
        sleep_hours: Math.round(sleepHours * 2) / 2,
        sleep_quality: aIdx === 1 && dayOffset >= -1 ? 2 : 3 + Math.floor(Math.random() * 3),
        energy: 2 + Math.floor(Math.random() * 3),
        has_soreness: aIdx === 0 || (aIdx === 2 && dayOffset >= -4),  // Alex and Sam have soreness
        soreness_body_part: aIdx === 0 ? 'Lower Back' : aIdx === 2 ? 'Legs' : undefined,
        soreness_level: aIdx === 0 ? 3 : aIdx === 2 ? 4 : undefined,
        stress: aIdx === 2 && dayOffset >= -3 ? 5 : 2 + Math.floor(Math.random() * 2),  // Sam exam stress
        motivation: 3 + Math.floor(Math.random() * 3),
        classes_today: 2 + Math.floor(Math.random() * 3),
        assignments_due: Math.random() > 0.7,
        exam_this_week: aIdx === 2 && dayOffset >= -3,  // Sam has exam
      },
      created_at: `${dateStr}T07:30:00Z`,
    })

    // Post-session check-in (skip for past 2 days for some athletes to create completion gaps)
    if (dayOffset < 0 && !(aIdx > 5 && dayOffset === -1)) {
      MOCK_WELLNESS_LOGS.push({
        id: `log-post-${athleteId}-${dayOffset}`,
        athlete_id: athleteId,
        session_id: null,
        log_type: 'post',
        data: {
          completion: Math.random() > 0.1 ? 'full' : 'partial',
          rpe: 5 + Math.floor(Math.random() * 4),
          legs_fatigue: 2 + Math.floor(Math.random() * 3),
          back_core_fatigue: 2 + Math.floor(Math.random() * 3),
          breathing_difficulty: 2 + Math.floor(Math.random() * 3),
          has_pain: aIdx === 0 && dayOffset >= -3,  // Alex flags pain
          pain_body_part: aIdx === 0 ? 'Lower Back' : undefined,
          pain_level: aIdx === 0 ? 3 : undefined,
          hit_target_splits: ['yes', 'close', 'no'][Math.floor(Math.random() * 3)] as 'yes' | 'close' | 'no',
          recovery_status: 2 + Math.floor(Math.random() * 3),
          ready_tomorrow: ['yes', 'maybe'][Math.floor(Math.random() * 2)] as 'yes' | 'maybe',
          studying_tonight: Math.random() > 0.5,
          academic_stress: 2 + Math.floor(Math.random() * 2),
        },
        created_at: `${dateStr}T16:00:00Z`,
      })
    }
  }
})

// Today's morning check-ins (only some athletes have submitted)
const checkedInAthletes = ['athlete-1', 'athlete-2', 'athlete-3', 'athlete-4', 'athlete-5']
checkedInAthletes.forEach((athleteId, idx) => {
  // Remove any existing today morning log and add confirmed ones
  const existing = MOCK_WELLNESS_LOGS.findIndex(
    l => l.athlete_id === athleteId && l.log_type === 'morning' && l.created_at.startsWith(d(0))
  )
  if (existing >= 0) MOCK_WELLNESS_LOGS.splice(existing, 1)

  MOCK_WELLNESS_LOGS.push({
    id: `log-morning-today-${athleteId}`,
    athlete_id: athleteId,
    session_id: null,
    log_type: 'morning',
    data: {
      sleep_hours: idx === 1 ? 5.5 : Math.round((7 + Math.random()) * 2) / 2,
      sleep_quality: idx === 1 ? 2 : 3 + Math.floor(Math.random() * 2),
      energy: 2 + Math.floor(Math.random() * 3),
      has_soreness: idx === 0 || idx === 2,
      soreness_body_part: idx === 0 ? 'Lower Back' : idx === 2 ? 'Legs' : undefined,
      soreness_level: idx === 0 ? 3 : idx === 2 ? 4 : undefined,
      stress: idx === 2 ? 5 : 2 + Math.floor(Math.random() * 2),
      motivation: 3 + Math.floor(Math.random() * 3),
      classes_today: 2 + Math.floor(Math.random() * 3),
      assignments_due: idx === 2,
      exam_this_week: idx === 2,
    },
    created_at: `${d(0)}T07:15:00Z`,
  })
})

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    athlete_id: 'athlete-1',
    coach_id: 'coach-1',
    type: 'soreness_streak',
    severity: 'high',
    data: { streak_days: 3, body_part: 'Lower Back' },
    reviewed_at: null,
    created_at: `${d(0)}T07:20:00Z`,
    athlete: MOCK_ATHLETES[0],
  },
  {
    id: 'alert-2',
    athlete_id: 'athlete-2',
    coach_id: 'coach-1',
    type: 'low_sleep',
    severity: 'high',
    data: { sleep_hours: 5.5, session_intensity: 'High' },
    reviewed_at: null,
    created_at: `${d(0)}T07:20:00Z`,
    athlete: MOCK_ATHLETES[1],
  },
  {
    id: 'alert-3',
    athlete_id: 'athlete-3',
    coach_id: 'coach-1',
    type: 'exam_tomorrow',
    severity: 'medium',
    data: { exam_subject: 'Thermodynamics', stress_level: 5 },
    reviewed_at: null,
    created_at: `${d(0)}T07:30:00Z`,
    athlete: MOCK_ATHLETES[2],
  },
]

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1', sender_id: 'athlete-1', receiver_id: 'coach-1', group_id: null,
    content: 'Coach, my lower back is really bothering me today. Should I modify the erg pieces?',
    is_urgent: false, read_at: null,
    created_at: `${d(0)}T06:45:00Z`,
    sender: MOCK_ATHLETES[0], receiver: MOCK_COACH,
  },
  {
    id: 'msg-2', sender_id: 'coach-1', receiver_id: 'athlete-1', group_id: null,
    content: 'Thanks for flagging. Let\'s do 2 pieces at low intensity and see how it feels. Stop if it sharpens.',
    is_urgent: false, read_at: `${d(0)}T08:00:00Z`,
    created_at: `${d(0)}T07:55:00Z`,
    sender: MOCK_COACH, receiver: MOCK_ATHLETES[0],
  },
  {
    id: 'msg-3', sender_id: 'athlete-3', receiver_id: 'coach-1', group_id: null,
    content: 'I have a thermo exam Friday. Can we talk about training intensity this week?',
    is_urgent: false, read_at: null,
    created_at: `${d(-1)}T21:00:00Z`,
    sender: MOCK_ATHLETES[2], receiver: MOCK_COACH,
  },
]

// Mutable personal events store (demo mode)
export const MOCK_PERSONAL_EVENTS: Array<{
  id: string; athlete_id: string; date: string;
  title: string; start_time: string; end_time: string; color: string; created_at: string;
}> = []

// Built-in survey templates
export const SURVEY_TEMPLATES = [
  {
    id: 'tpl-race-week', title: 'Race Week Readiness', description: 'Assess athlete readiness before a race or regatta', is_template: true,
    questions: [
      { id: 'q1', type: 'scale_1_10', text: 'How confident are you feeling about the upcoming race? (1=not at all, 10=very)' },
      { id: 'q2', type: 'scale_1_5', text: 'Rate your energy levels this week (1=exhausted, 5=peak)' },
      { id: 'q3', type: 'yes_no', text: 'Any new physical concerns or pains?' },
      { id: 'q4', type: 'scale_1_5', text: 'How well are you sleeping? (1=poorly, 5=great)' },
      { id: 'q5', type: 'text', text: 'Any mental or emotional factors you want me to know about?' },
    ]
  },
  {
    id: 'tpl-monthly', title: 'Monthly Reflection', description: 'End-of-month review on progress, challenges, and goals', is_template: true,
    questions: [
      { id: 'q1', type: 'scale_1_10', text: 'How satisfied are you with your training progress this month?' },
      { id: 'q2', type: 'multiple_choice', text: 'What was your biggest challenge?', options: ['Fatigue', 'Academic workload', 'Technique', 'Motivation', 'Injury/pain'] },
      { id: 'q3', type: 'scale_1_5', text: 'How supported do you feel by the coaching staff?' },
      { id: 'q4', type: 'text', text: 'What goal do you want to focus on next month?' },
      { id: 'q5', type: 'yes_no', text: 'Would you like a 1-on-1 check-in meeting?' },
      { id: 'q6', type: 'text', text: 'Anything else you want to share?' },
    ]
  },
  {
    id: 'tpl-injury', title: 'Injury Check-In', description: 'Follow up on existing pain or injury status', is_template: true,
    questions: [
      { id: 'q1', type: 'scale_1_10', text: 'Current pain level (0=none, 10=severe)' },
      { id: 'q2', type: 'multiple_choice', text: 'Location of discomfort', options: ['Lower back', 'Upper back', 'Shoulder', 'Knee', 'Hip', 'Wrist/forearm', 'Ribs', 'Other'] },
      { id: 'q3', type: 'multiple_choice', text: 'Is the pain getting better, worse, or same?', options: ['Better', 'Same', 'Worse'] },
      { id: 'q4', type: 'text', text: 'Describe what makes it better or worse during training' },
    ]
  },
]

// Mutable surveys store (demo mode — coach creates surveys here)
export const MOCK_SURVEYS: Array<{
  id: string; team_id: string; coach_id: string; title: string; description: string;
  questions: Array<{ id: string; type: string; text: string; options?: string[] }>;
  is_template: boolean; created_at: string;
}> = []

// Mutable survey assignments store (demo mode)
export const MOCK_SURVEY_ASSIGNMENTS: Array<{
  id: string; survey_id: string; athlete_id: string | null; team_id: string;
  assigned_at: string; due_at: string | null; completed_at: string | null;
}> = []

// Mutable survey responses store (demo mode)
export const MOCK_SURVEY_RESPONSES: Array<{
  id: string; survey_id: string; assignment_id: string; athlete_id: string;
  answers: Record<string, string | number>; created_at: string;
}> = []

// Demo accounts map
export const DEMO_ACCOUNTS: Record<string, { profile: Profile; password: string }> = {
  'coach@rowiq.demo': { profile: MOCK_COACH, password: 'Demo1234!' },
  'alex@rowiq.demo':   { profile: MOCK_ATHLETES[0], password: 'Demo1234!' },
  'jordan@rowiq.demo': { profile: MOCK_ATHLETES[1], password: 'Demo1234!' },
  'sam@rowiq.demo':    { profile: MOCK_ATHLETES[2], password: 'Demo1234!' },
  'taylor@rowiq.demo': { profile: MOCK_ATHLETES[3], password: 'Demo1234!' },
  'morgan@rowiq.demo': { profile: MOCK_ATHLETES[4], password: 'Demo1234!' },
  'casey@rowiq.demo':  { profile: MOCK_ATHLETES[5], password: 'Demo1234!' },
  'riley@rowiq.demo':  { profile: MOCK_ATHLETES[6], password: 'Demo1234!' },
  'jamie@rowiq.demo':  { profile: MOCK_ATHLETES[7], password: 'Demo1234!' },
  'admin@rowiq.demo':  { profile: MOCK_SUPERADMIN,  password: 'Demo1234!' },
}
