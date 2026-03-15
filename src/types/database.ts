export type UserRole = 'coach' | 'athlete' | 'superadmin'
export type AccountStatus = 'pending' | 'active' | 'rejected'
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
  status: AccountStatus
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
  year: string | null
  boat_class: string | null
  seat_position: string | null
  height_cm: number | null
  weight_kg: number | null
  sleep_goal: number
  injuries_text: string | null
  created_at: string
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

export interface MediaItem {
  url: string
  title?: string
  type: 'image' | 'video' | 'link'
}

export interface PersonalEvent {
  id: string
  athlete_id: string
  date: string        // 'YYYY-MM-DD'
  title: string
  start_time: string  // 'HH:MM'
  end_time: string    // 'HH:MM'
  color: string
  created_at: string
}

export interface SurveyQuestion {
  id: string
  type: 'text' | 'scale_1_5' | 'scale_1_10' | 'multiple_choice' | 'yes_no'
  text: string
  options?: string[]
}

export interface Survey {
  id: string
  team_id: string
  coach_id: string
  title: string
  description?: string
  questions: SurveyQuestion[]
  is_template: boolean
  created_at: string
}

export interface SurveyAssignment {
  id: string
  survey_id: string
  athlete_id: string | null
  team_id: string
  assigned_at: string
  due_at: string | null
  completed_at: string | null
  survey?: Survey
}

export interface SurveyResponse {
  id: string
  survey_id: string
  assignment_id: string
  athlete_id: string
  answers: Record<string, string | number>
  created_at: string
}

export interface Session {
  id: string
  team_id: string
  date: string
  type: SessionType
  duration: number
  start_time?: string | null  // 'HH:MM' e.g. '09:00'
  end_time?: string | null    // 'HH:MM' e.g. '10:30'
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
  media_urls?: MediaItem[]
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

export interface ChatGroup {
  id: string
  team_id: string
  name: string
  created_by: string | null
  created_at: string
}

export interface ChatGroupMember {
  group_id: string
  profile_id: string
  joined_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string | null
  group_id: string | null
  content: string
  is_urgent: boolean
  read_at: string | null
  created_at: string
  sender?: Profile
  receiver?: Profile
  group?: ChatGroup
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
// Must include Views/Functions/Enums/CompositeTypes to satisfy Supabase's GenericSchema constraint
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile>; Relationships: [] }
      teams: { Row: Team; Insert: Omit<Team, 'id' | 'created_at'>; Update: Partial<Team>; Relationships: [] }
      athletes: { Row: Athlete; Insert: Omit<Athlete, 'id' | 'created_at'>; Update: Partial<Athlete>; Relationships: [] }
      academic_schedules: { Row: AcademicSchedule; Insert: Omit<AcademicSchedule, 'id'>; Update: Partial<AcademicSchedule>; Relationships: [] }
      sessions: { Row: Session; Insert: Omit<Session, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Session>; Relationships: [] }
      wellness_logs: { Row: WellnessLog; Insert: Omit<WellnessLog, 'id' | 'created_at'>; Update: Partial<WellnessLog>; Relationships: [] }
      messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at' | 'sender' | 'receiver' | 'group'>; Update: Partial<Message>; Relationships: [] }
      alerts: { Row: Alert; Insert: Omit<Alert, 'id' | 'created_at' | 'athlete'>; Update: Partial<Alert>; Relationships: [] }
      injuries: { Row: Injury; Insert: Omit<Injury, 'id' | 'created_at'>; Update: Partial<Injury>; Relationships: [] }
      chat_groups: { Row: ChatGroup; Insert: Omit<ChatGroup, 'id' | 'created_at'>; Update: Partial<ChatGroup>; Relationships: [] }
      chat_group_members: { Row: ChatGroupMember; Insert: Omit<ChatGroupMember, 'joined_at'>; Update: Partial<ChatGroupMember>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
