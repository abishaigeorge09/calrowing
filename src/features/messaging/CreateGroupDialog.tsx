import { useState } from 'react'
import { X, Search, Check, Users, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useTeamCoach } from '@/hooks/useTeamCoach'
import { useAuthStore } from '@/stores/auth'
import { useCreateChatGroup } from '@/hooks/useChatGroups'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface Props {
  onClose: () => void
  onCreated: (groupId: string) => void
}

export default function CreateGroupDialog({ onClose, onCreated }: Props) {
  const { user } = useAuthStore()
  const { data: athletes = [] } = useTeamAthletes(user?.team_id)
  const { data: coachProfile } = useTeamCoach(user?.team_id)
  const createGroup = useCreateChatGroup()

  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Build full member list: coach sees athletes, athlete sees coach + other athletes
  const isCoach = user?.role === 'coach'
  const allMembers: Array<{ id: string; name: string; role: string }> = isCoach
    ? athletes.filter(a => a.id !== user?.id)
    : [
        ...(coachProfile ? [{ id: coachProfile.id, name: coachProfile.name, role: 'coach' }] : []),
        ...athletes.filter(a => a.id !== user?.id),
      ]

  const filteredAthletes = allMembers.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleAthlete = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.length === 0) return
    setError(null)
    try {
      const group = await createGroup.mutateAsync({
        name: name.trim(),
        memberIds: selectedIds
      })
      onCreated(group.id)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to create group. Make sure you have run the database migration.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" /> New Group
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">Start a conversation with multiple people</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-red-500 flex-1">{error}</p>
            </div>
          )}
          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Group Name</label>
            <Input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Varsity 8+ Strategy"
              className="bg-black/40 border-white/10 focus:border-white rounded-2xl py-6 px-4 text-white placeholder:text-gray-600"
            />
          </div>

          {/* Member Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Add Members ({selectedIds.length})</label>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search athletes..."
                className="bg-black/40 border-white/10 focus:border-white rounded-2xl py-6 pl-12 pr-4 text-white placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-1 mt-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {filteredAthletes.map(member => {
                const isSelected = selectedIds.includes(member.id)
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleAthlete(member.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-2xl transition-all border",
                      isSelected
                        ? "bg-white/10 border-white/20"
                        : "bg-transparent border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-white tracking-wide">{member.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500">{member.role}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                      isSelected ? "bg-white border-white" : "border-white/20"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-black stroke-[4px]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5">
          <Button
            disabled={!name.trim() || selectedIds.length === 0 || createGroup.isPending}
            onClick={handleCreate}
            className="w-full bg-white text-black hover:bg-gray-200 rounded-2xl py-6 font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
          >
            {createGroup.isPending ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </div>
    </div>
  )
}
