import type { WellnessLog, Session, Alert } from '@/types/database'
import type { MorningLogData } from '@/types/database'

export interface AlertDescriptor {
  type: Alert['type']
  severity: Alert['severity']
  data: Record<string, unknown>
}

/**
 * Called after a morning check-in is saved.
 * Returns alert descriptors to insert (0–2 typically).
 */
export function generateMorningAlerts(params: {
  coachId: string
  athleteId: string
  todayLog: MorningLogData
  recentLogs: WellnessLog[]   // recent morning logs, newest-first
  tomorrowSession: Session | null
}): AlertDescriptor[] {
  const { todayLog, recentLogs, tomorrowSession } = params
  const alerts: AlertDescriptor[] = []

  // Rule 1: soreness streak — 3+ consecutive days
  if (todayLog.has_soreness) {
    const morningLogs = recentLogs
      .filter(l => l.log_type === 'morning')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))

    let streakDays = 1  // today
    for (const log of morningLogs) {
      const d = log.data as MorningLogData
      if (d.has_soreness) streakDays++
      else break
    }

    if (streakDays >= 3) {
      alerts.push({
        type: 'soreness_streak',
        severity: streakDays >= 5 ? 'high' : 'medium',
        data: {
          streak_days: streakDays,
          body_part: todayLog.soreness_body_part ?? 'Unknown',
        },
      })
    }
  }

  // Rule 2: low sleep before a hard session tomorrow
  if (
    typeof todayLog.sleep_hours === 'number' &&
    todayLog.sleep_hours < 6.5 &&
    tomorrowSession &&
    (tomorrowSession.intensity === 'High' || tomorrowSession.intensity === 'Race Pace')
  ) {
    alerts.push({
      type: 'low_sleep',
      severity: 'high',
      data: {
        sleep_hours: todayLog.sleep_hours,
        session_intensity: tomorrowSession.intensity,
        session_date: tomorrowSession.date,
      },
    })
  }

  return alerts
}

/** Called when post-session check-in has_pain = true */
export function generatePainAlert(): AlertDescriptor {
  return {
    type: 'injury',
    severity: 'high',
    data: { source: 'post_session_checkin' },
  }
}
