import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useTeamCoach } from '@/hooks/useTeamCoach'
import { useMessages } from '@/hooks/useMessages'
import { useSendMessage } from '@/hooks/mutations'
import { getInitials, cn } from '@/lib/utils'

export default function MessagesPage() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const defaultTo = searchParams.get('to')

  const isCoach = user?.role === 'coach'
  const { data: athletes = [] } = useTeamAthletes(user?.team_id)
  const { data: coachProfile } = useTeamCoach(!isCoach ? user?.team_id : null)

  // Coach sees athletes as partners; athlete sees their coach
  const partners = isCoach ? athletes : (coachProfile ? [coachProfile] : [])

  const [selectedId, setSelectedId] = useState<string>(
    defaultTo ?? (isCoach ? (athletes[0]?.id ?? '') : (coachProfile?.id ?? ''))
  )

  // Update selectedId when data loads
  useEffect(() => {
    if (isCoach && !selectedId && athletes.length > 0) {
      setSelectedId(athletes[0].id)
    }
    if (!isCoach && !selectedId && coachProfile) {
      setSelectedId(coachProfile.id)
    }
  }, [isCoach, athletes, coachProfile, selectedId])

  const { data: conversation = [] } = useMessages(user?.id, selectedId || null)
  const sendMessage = useSendMessage()

  const [text, setText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const handleSend = async () => {
    if (!text.trim() || !selectedId) return
    await sendMessage.mutateAsync({
      receiverId: selectedId,
      content: text.trim(),
      isUrgent,
    })
    setText('')
    setIsUrgent(false)
  }

  const selectedPartner = partners.find(p => p.id === selectedId)

  return (
    <div className="flex h-[calc(100dvh-130px)] max-w-2xl mx-auto">
      {/* Sidebar: conversation list */}
      <div className="w-20 sm:w-56 bg-white border-r border-slate-100 flex flex-col">
        <div className="p-3 border-b border-slate-100">
          <p className="font-bold text-slate-900 text-sm hidden sm:block">Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {partners.length === 0 && (
            <p className="text-xs text-slate-400 p-3 text-center">Loading…</p>
          )}
          {partners.map(partner => (
            <button
              key={partner.id}
              onClick={() => setSelectedId(partner.id)}
              className={cn(
                'w-full flex items-center gap-2.5 p-3 hover:bg-slate-50 transition-colors text-left',
                selectedId === partner.id && 'bg-blue-50'
              )}
            >
              <div className="w-9 h-9 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center text-sm font-bold text-[#1e3a5f] flex-shrink-0">
                {getInitials(partner.name)}
              </div>
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className="font-semibold text-slate-900 text-sm truncate">{partner.name}</p>
                <p className="text-xs text-slate-400">{partner.role === 'coach' ? 'Coach' : 'Athlete'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center text-sm font-bold text-[#1e3a5f]">
            {selectedPartner ? getInitials(selectedPartner.name) : '?'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{selectedPartner?.name ?? '—'}</p>
            <p className="text-xs text-slate-400">{selectedPartner?.role === 'coach' ? 'Coach' : 'Athlete'}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {conversation.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-8">
              No messages yet. Start the conversation.
            </div>
          )}
          {conversation.map(msg => {
            const isMine = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                  isMine ? 'bg-[#1e3a5f] text-white rounded-br-sm' : 'bg-white text-slate-900 rounded-bl-sm shadow-sm',
                )}>
                  {msg.is_urgent && (
                    <div className="flex items-center gap-1 text-xs text-orange-300 mb-1">
                      <AlertTriangle className="h-3 w-3" /> Urgent
                    </div>
                  )}
                  <p>{msg.content}</p>
                  <p className={cn('text-xs mt-1', isMine ? 'text-white/60' : 'text-slate-400')}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
              <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)}
                className="accent-orange-500" />
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              Mark urgent
            </label>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type a message…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <Button size="icon" onClick={handleSend} disabled={!text.trim() || sendMessage.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
