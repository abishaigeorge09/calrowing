import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, IS_SUPABASE } from '@/lib/db'
import type { ChatGroup, Profile } from '@/types/database'
import { useAuthStore } from '@/stores/auth'

export function useChatGroups() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['chat-groups', user?.team_id],
    queryFn: async () => {
      if (!IS_SUPABASE || !user?.team_id) {
        // Return a mock group for testing if not connected to Supabase
        return [{ 
          id: 'mock-group-1', 
          name: 'Varsity 8+ Strategy', 
          team_id: 'team-1', 
          created_by: 'coach-1',
          created_at: new Date().toISOString()
        }] as ChatGroup[]
      }

      // RLS policy (chat_groups_select) already filters to groups where
      // the user is the creator OR a member — no explicit join needed.
      const { data, error } = await supabase
        .from('chat_groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching chat groups:', error)
        return []
      }
      return data as ChatGroup[]
    },
    enabled: !!user?.id,
  })
}

export function useCreateChatGroup() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: string[] }) => {
      if (!user) throw new Error('Not authenticated')
      if (!IS_SUPABASE) {
        // Mock group creation for demo mode
        console.log('Mock: Creating group', { name, memberIds })
        await new Promise(r => setTimeout(r, 1000))
        return { id: `mock-group-${Date.now()}`, name, team_id: user.team_id, created_by: user.id } as ChatGroup
      }

      // 1. Create the group
      const { data: group, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          name,
          team_id: user.team_id,
          created_by: user.id
        })
        .select()
        .single()

      if (groupError) {
        console.error('Group insertion error:', groupError)
        throw groupError
      }

      // 2. Add members (including creator)
      const allMembers = Array.from(new Set([...memberIds, user.id]))
      const memberEntries = allMembers.map(pid => ({
        group_id: group.id,
        profile_id: pid
      }))

      const { error: membersError } = await supabase
        .from('chat_group_members')
        .insert(memberEntries)

      if (membersError) {
        console.error('Members insertion error:', membersError)
        throw membersError
      }

      return group as ChatGroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] })
    }
  })
}

export function useGroupMembers(groupId?: string) {
  return useQuery({
    queryKey: ['chat-group-members', groupId],
    queryFn: async () => {
      if (!IS_SUPABASE || !groupId) return []

      const { data, error } = await supabase
        .from('chat_group_members')
        .select(`
          profile_id,
          profiles (*)
        `)
        .eq('group_id', groupId)

      if (error) {
        console.error('Error fetching group members:', error)
        return []
      }
      return data.map(d => (d as any).profiles) as Profile[]
    },
    enabled: !!groupId,
  })
}

