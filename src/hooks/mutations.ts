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

// ─── Helper: notify coach ──────────────────────────────────────────────────────
async function notifyCoach(coachId: string, payload: {
  type: string
  title: string
  body: string
  actionUrl: string
  data?: Record<string, unknown>
}) {
  try {
    await supabase.from('notifications').insert({
      user_id: coachId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      action_url: payload.actionUrl,
      data: payload.data ?? null,
    })
  } catch (e) {
    // Notifications are best-effort — don't break the main flow
    console.warn('Could not send coach notification:', e)
  }
}

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

      // 2. Notify coach about check-in submission
      if (payload.coachId) {
        const logLabel = payload.logType === 'morning' ? 'Morning'
          : payload.logType === 'post' ? 'Post-session'
          : 'Evening'
        const emoji = payload.logType === 'morning' ? '🌅'
          : payload.logType === 'post' ? '💪'
          : '🌙'
        await notifyCoach(payload.coachId, {
          type: 'survey_submitted',
          title: `${emoji} ${user.name} — ${logLabel} check-in`,
          body: `${user.name} completed their ${logLabel.toLowerCase()} check-in.`,
          actionUrl: `/coach/athlete/${user.id}`,
          data: { athlete_id: user.id, log_type: payload.logType },
        })
      }

      // 3. Morning check-in → generate alerts
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

      // 4. Post-session with pain → injury + alert + notify coach
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

          // Notify coach about pain flag
          await notifyCoach(payload.coachId, {
            type: 'pain_flag',
            title: `🚨 Pain flag — ${postData.pain_body_part ?? 'Unknown'}`,
            body: `${user.name} reported ${sev.toLowerCase()} pain: ${postData.pain_body_part ?? 'unknown area'} (level ${postData.pain_level ?? '?'}/5).`,
            actionUrl: `/coach/athlete/${user.id}`,
            data: { athlete_id: user.id, body_part: postData.pain_body_part, pain_level: postData.pain_level, severity: sev },
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
        queryClient.invalidateQueries({ queryKey: ['notifications', payload.coachId] })
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

      // Notify coach immediately about injury flag
      await notifyCoach(payload.coachId, {
        type: 'injury_flag',
        title: `🚨 Injury flag — ${payload.bodyPart}`,
        body: `${user.name} flagged ${payload.severity.toLowerCase()} pain: ${payload.bodyPart}.${payload.description ? ` "${payload.description}"` : ''}`,
        actionUrl: `/coach/athlete/${user.id}`,
        data: { athlete_id: user.id, body_part: payload.bodyPart, severity: payload.severity },
      })
    },

    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', vars.coachId] })
      queryClient.invalidateQueries({ queryKey: ['notifications', vars.coachId] })
    },
  })
}

// ─── useUpdateAthleteProfile ───────────────────────────────────────────────────
export function useUpdateAthleteProfile() {
  const queryClient = useQueryClient()
  const { user, updateProfile } = useAuthStore()

  return useMutation({
    mutationFn: async (updates: {
      name?: string
      height_cm?: number | null
      weight_kg?: number | null
      sleep_goal?: number
      boat_class?: string | null
      seat_position?: string | null
      year?: string | null
      injuries_text?: string | null
    }) => {
      if (!IS_SUPABASE || !user) {
        // Demo mode: update local auth state only
        if (updates.name) updateProfile({ name: updates.name })
        await new Promise(r => setTimeout(r, 400))
        return
      }

      const { name, ...athleteFields } = updates

      // Update profile name if provided
      if (name && name !== user.name) {
        const { error } = await supabase
          .from('profiles')
          .update({ name })
          .eq('id', user.id)
        if (error) throw new Error(error.message)
        updateProfile({ name })
      }

      // Update athlete_profiles record
      const definedFields = Object.fromEntries(
        Object.entries(athleteFields).filter(([, v]) => v !== undefined)
      )
      if (Object.keys(definedFields).length > 0) {
        // Try updating by id (shared PK pattern common in Supabase)
        const { error } = await supabase
          .from('athletes')
          .update(definedFields)
          .eq('id', user.id)
        if (error) throw new Error(error.message)
      }
    },

    onSuccess: () => {
      if (!user) return
      queryClient.invalidateQueries({ queryKey: ['athletes'] })
      queryClient.invalidateQueries({ queryKey: ['teamAthletes'] })
    },
  })
}

// ─── useDeleteSession ──────────────────────────────────────────────────────────
export function useDeleteSession() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!IS_SUPABASE || !user) {
        await new Promise(r => setTimeout(r, 400))
        return
      }
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

// ─── useUpdateCoachProfile ─────────────────────────────────────────────────────
export function useUpdateCoachProfile() {
  const { user, updateProfile } = useAuthStore()

  return useMutation({
    mutationFn: async (updates: { name?: string }) => {
      if (!IS_SUPABASE || !user) {
        if (updates.name) updateProfile({ name: updates.name })
        await new Promise(r => setTimeout(r, 400))
        return
      }
      if (updates.name && updates.name !== user.name) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: updates.name })
          .eq('id', user.id)
        if (error) throw new Error(error.message)
        updateProfile({ name: updates.name })
      }
    },
  })
}
