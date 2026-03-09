export type UserRole = 'coach' | 'athlete'
export type SessionType = 'Erg' | 'Water' | 'Weights' | 'Cross Training' | 'Rest'
export type Intensity = 'Low' | 'Moderate' | 'High' | 'Race Pace'
export type AlertType = 'soreness_streak' | 'low_sleep' | 'injury' | 'exam_tomorrow' | 'missed_session'
export type AlertSeverity = 'low' | 'medium' | 'high'
export type LogType = 'morning' | 'post' | 'evening'

export interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  team_id: string | null
  avatar_url: string | null
  created_at: string
}

export interface Team {
  id: string
  name: string
  invite_code: string
  sport: string
  division: string
  season_start: string
  season_end: string
  coach_id: string
  created_at: string
}

export interface Athlete {
  id: string
  user_id: string
  team_id: string
  year: string
  boat_class: string
  seat_position: string
  height_cm: number | null
  weight_kg: number | null
  sleep_goal: number
  injuries_text: string | null
}

export interface AcademicSchedule {
  id: string
  athlete_id: string
  classes_per_day: number
  hard_days: string[]
  exam_weeks: ExamWeek[]
}

export interface ExamWeek {
  date: string
  subject: string
  difficulty: number
}

export interface Session {
  id: string
  team_id: string
  date: string
  type: SessionType
  duration: number
  intensity: Intensity
  warmup: string
  main_set: string
  cooldown: string
  target_split: string | null
  stroke_rate: number | null
  hr_zone: string | null
  assigned_to: 'whole_team' | string
  coach_notes: string | null
  is_notes_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface MorningLogData {
  sleep_hours: number
  sleep_quality: number
  energy: number
  has_soreness: boolean
  soreness_body_part?: string
  soreness_level?: number
  stress: number
  motivation: number
  classes_today: number
  assignments_due: boolean
  exam_this_week: boolean
  note_to_coach?: string
}

export interface PostSessionLogData {
  completion: 'full' | 'partial' | 'dnf'
  dnf_reason?: string
  rpe: number
  legs_fatigue: number
  back_core_fatigue: number
  breathing_difficulty: number
  has_pain: boolean
  pain_body_part?: string
  pain_level?: number
  hit_target_splits: 'yes' | 'close' | 'no'
  felt_good?: string
  felt_off?: string
  recovery_status: number
  ready_tomorrow: 'yes' | 'maybe' | 'no'
  studying_tonight: boolean
  study_hours?: number
  academic_stress: number
  note_to_coach?: string
}

export interface EveningLogData {
  energy: number
  nutrition_quality: number
  hydration: number
  expected_sleep_hours: number
  day_rating: number
}

export interface WellnessLog {
  id: string
  athlete_id: string
  session_id: string | null
  log_type: LogType
  data: MorningLogData | PostSessionLogData | EveningLogData
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_urgent: boolean
  read_at: string | null
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Alert {
  id: string
  athlete_id: string
  coach_id: string
  type: AlertType
  severity: AlertSeverity
  data: Record<string, unknown>
  reviewed_at: string | null
  created_at: string
  athlete?: Profile
}

export interface Injury {
  id: string
  athlete_id: string
  body_part: string
  severity: 'Mild' | 'Moderate' | 'Severe'
  description: string | null
  created_at: string
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      teams: { Row: Team; Insert: Omit<Team, 'id' | 'created_at'>; Update: Partial<Team> }
      athletes: { Row: Athlete; Insert: Omit<Athlete, 'id'>; Update: Partial<Athlete> }
      academic_schedules: { Row: AcademicSchedule; Insert: Omit<AcademicSchedule, 'id'>; Update: Partial<AcademicSchedule> }
      sessions: { Row: Session; Insert: Omit<Session, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Session> }
      wellness_logs: { Row: WellnessLog; Insert: Omit<WellnessLog, 'id' | 'created_at'>; Update: Partial<WellnessLog> }
      messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at'>; Update: Partial<Message> }
      alerts: { Row: Alert; Insert: Omit<Alert, 'id' | 'created_at'>; Update: Partial<Alert> }
      injuries: { Row: Injury; Insert: Omit<Injury, 'id' | 'created_at'>; Update: Partial<Injury> }
    }
  }
}
