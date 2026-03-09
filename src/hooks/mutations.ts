import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { useAuthStore } from '@/stores/auth'
import { generateMorningAlerts, generatePainAlert } from '@/hooks/useAlertGeneration'
import type {
  MorningLogData,
  PostSessionLogData,
  EveningLogData,
  Session,
  WellnessLog,
} from '@/types/database'

// ─── useSubmitWellnessLog ──────────────────────────────────────────────────────
interface WellnessLogPayload {
  logType: 'morning' | 'post' | 'evening'
  data: MorningLogData | PostSessionLogData | EveningLogData
  sessionId?: string
  coachId?: string
  // morning only — for alert generation
  recentLogs?: WellnessLog[]
  tomorrowSession?: Session | null
}

export function useSubmitWellnessLog() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: WellnessLogPayload) => {
      if (!IS_SUPABASE || !user) {
        await new Promise(r => setTimeout(r, 600))
        return
      }

      // 1. Insert the wellness log
      const { error: logError } = await supabase.from('wellness_logs').insert({
        athlete_id: user.id,
        session_id: payload.sessionId ?? null,
        log_type: payload.logType,
        data: payload.data,
      })
      if (logError) throw new Error(logError.message)

      // 2. Morning check-in → generate alerts
      if (payload.logType === 'morning' && payload.coachId) {
        const descriptors = generateMorningAlerts({
          coachId: payload.coachId,
          athleteId: user.id,
          todayLog: payload.data as MorningLogData,
          recentLogs: payload.recentLogs ?? [],
          tomorrowSession: payload.tomorrowSession ?? null,
        })

        for (const desc of descriptors) {
          await supabase.from('alerts').insert({
            athlete_id: user.id,
            coach_id: payload.coachId,
            type: desc.type,
            severity: desc.severity,
            data: desc.data,
          })
        }
      }

      // 3. Post-session with pain → injury + alert
      if (payload.logType === 'post' && payload.coachId) {
        const postData = payload.data as PostSessionLogData
        if (postData.has_pain) {
          const sev = (postData.pain_level ?? 0) >= 4 ? 'Severe'
                    : (postData.pain_level ?? 0) >= 3 ? 'Moderate'
                    : 'Mild'

          await supabase.from('injuries').insert({
            athlete_id: user.id,
            body_part: postData.pain_body_part ?? 'Unknown',
            severity: sev,
            description: null,
          })

          const alertDesc = generatePainAlert()
          await supabase.from('alerts').insert({
            athlete_id: user.id,
            coach_id: payload.coachId,
            type: alertDesc.type,
            severity: alertDesc.severity,
            data: { ...alertDesc.data, body_part: postData.pain_body_part, pain_level: postData.pain_level },
          })
        }
      }
    },

    onSuccess: (_, payload) => {
      if (!user) return
      queryClient.invalidateQueries({ queryKey: ['wellnessLogs', user.id] })
      queryClient.invalidateQueries({ queryKey: ['teamWellnessLogs'] })
      if (payload.coachId) {
        queryClient.invalidateQueries({ queryKey: ['alerts', payload.coachId] })
      }
    },
  })
}

// ─── useCreateSession ──────────────────────────────────────────────────────────
export function useCreateSession() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (sessionData: {
      team_id: string
      date: string
      type: Session['type']
      duration: number
      intensity: Session['intensity']
      warmup?: string
      main_set: string
      cooldown?: string
      target_split?: string
      stroke_rate?: string
      hr_zone?: string
      assigned_to: string
      coach_notes?: string
      is_notes_public: boolean
    }) => {
      if (!IS_SUPABASE || !user) {
        await new Promise(r => setTimeout(r, 500))
        return
      }
      const { error } = await supabase.from('sessions').insert({
        ...sessionData,
        created_by: user.id,
      })
      if (error) throw new Error(error.message)
    },

    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', vars.team_id] })
    },
  })
}

// ─── useSendMessage ────────────────────────────────────────────────────────────
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: {
      receiverId: string
      content: string
      isUrgent?: boolean
    }) => {
      if (!IS_SUPABASE || !user) {
        await new Promise(r => setTimeout(r, 200))
        return
      }
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: payload.receiverId,
        content: payload.content,
        is_urgent: payload.isUrgent ?? false,
        read_at: null,
      })
      if (error) throw new Error(error.message)
    },

    onSuccess: (_, vars) => {
      if (!user) return
      const key = [user.id, vars.receiverId].sort().join('-')
      queryClient.invalidateQueries({ queryKey: ['messages', key] })
      queryClient.invalidateQueries({ queryKey: ['allConversations', user.id] })
    },
  })
}

// ─── useMarkAlertReviewed ──────────────────────────────────────────────────────
export function useMarkAlertReviewed() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!IS_SUPABASE || !user) return
      const { error } = await supabase
        .from('alerts')
        .update({ reviewed_at: new Date().toISOString() })
        .eq('id', alertId)
        .eq('coach_id', user.id)
      if (error) throw new Error(error.message)
    },

    onSuccess: () => {
      if (!user) return
      queryClient.invalidateQueries({ queryKey: ['alerts', user.id] })
    },
  })
}

// ─── useLogInjury ──────────────────────────────────────────────────────────────
export function useLogInjury() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: {
      bodyPart: string
      severity: 'Mild' | 'Moderate' | 'Severe'
      description: string
      coachId: string
    }) => {
      if (!IS_SUPABASE || !user) {
        await new Promise(r => setTimeout(r, 600))
        return
      }

      const { error: injuryError } = await supabase.from('injuries').insert({
        athlete_id: user.id,
        body_part: payload.bodyPart,
        severity: payload.severity,
        description: payload.description || null,
      })
      if (injuryError) throw new Error(injuryError.message)

      const alertSev = payload.severity === 'Severe' ? 'high'
                     : payload.severity === 'Moderate' ? 'medium'
                     : 'low'

      const { error: alertError } = await supabase.from('alerts').insert({
        athlete_id: user.id,
        coach_id: payload.coachId,
        type: 'injury',
        severity: alertSev,
        data: { body_part: payload.bodyPart, severity: payload.severity },
      })
      if (alertError) throw new Error(alertError.message)
    },

    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', vars.coachId] })
    },
  })
}
