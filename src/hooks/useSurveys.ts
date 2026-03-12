import { useQuery } from '@tanstack/react-query'
import { IS_SUPABASE, supabase } from '@/lib/db'
import {
  MOCK_SURVEYS, MOCK_SURVEY_ASSIGNMENTS, MOCK_SURVEY_RESPONSES, SURVEY_TEMPLATES,
} from '@/lib/mock-data'
import type { Survey, SurveyAssignment, SurveyResponse } from '@/types/database'

/** Fetch all surveys (team-created + templates) for a coach */
export function useSurveys(teamId: string | null | undefined) {
  return useQuery({
    queryKey: ['surveys', teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<Survey[]> => {
      if (!IS_SUPABASE || !teamId) {
        return [
          ...SURVEY_TEMPLATES,
          ...MOCK_SURVEYS.filter(s => s.team_id === teamId),
        ] as Survey[]
      }
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as Survey[]
    },
  })
}

/** Fetch pending survey assignments for an athlete */
export function useSurveyAssignments(athleteId: string | null | undefined) {
  return useQuery({
    queryKey: ['survey_assignments', athleteId],
    enabled: !!athleteId,
    queryFn: async (): Promise<SurveyAssignment[]> => {
      if (!IS_SUPABASE || !athleteId) {
        const myAssignments = MOCK_SURVEY_ASSIGNMENTS.filter(
          a => a.athlete_id === athleteId && !a.completed_at
        )
        // Attach survey data
        return myAssignments.map(a => ({
          ...a,
          survey: (MOCK_SURVEYS.find(s => s.id === a.survey_id) ?? SURVEY_TEMPLATES.find(s => s.id === a.survey_id)) as Survey | undefined,
        })) as SurveyAssignment[]
      }
      const { data, error } = await supabase
        .from('survey_assignments')
        .select('*, survey:surveys(*)')
        .eq('athlete_id', athleteId)
        .is('completed_at', null)
        .order('assigned_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as SurveyAssignment[]
    },
  })
}

/** Fetch all responses for a survey (coach view) */
export function useSurveyResponses(surveyId: string | null | undefined) {
  return useQuery({
    queryKey: ['survey_responses', surveyId],
    enabled: !!surveyId,
    queryFn: async (): Promise<SurveyResponse[]> => {
      if (!IS_SUPABASE || !surveyId) {
        return MOCK_SURVEY_RESPONSES.filter(r => r.survey_id === surveyId) as SurveyResponse[]
      }
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as SurveyResponse[]
    },
  })
}

/** All assignments for a team (coach sees response rates) */
export function useTeamSurveyAssignments(teamId: string | null | undefined) {
  return useQuery({
    queryKey: ['survey_assignments', 'team', teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<SurveyAssignment[]> => {
      if (!IS_SUPABASE || !teamId) {
        return MOCK_SURVEY_ASSIGNMENTS as SurveyAssignment[]
      }
      const { data, error } = await supabase
        .from('survey_assignments')
        .select('*')
        .eq('team_id', teamId)
        .order('assigned_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as SurveyAssignment[]
    },
  })
}
