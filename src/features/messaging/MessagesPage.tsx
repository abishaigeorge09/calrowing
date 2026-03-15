import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, AlertTriangle, Search, X, MessageSquare, Hexagon, Plus, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useTeamCoach } from '@/hooks/useTeamCoach'
import { useMessages } from '@/hooks/useMessages'
import { useSendMessage, useMarkMessagesRead } from '@/hooks/mutations'
import { useChatGroups } from '@/hooks/useChatGroups'
import { getInitials, cn } from '@/lib/utils'
import CreateGroupDialog from './CreateGroupDialog'

export default function MessagesPage() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const defaultTo = searchParams.get('to')

  const isCoach = user?.role === 'coach'
  const { data: athletes = [], isLoading: isLoadingAthletes } = useTeamAthletes(user?.team_id)
  const { data: coachProfile, isLoading: isLoadingCoach } = useTeamCoach(user?.team_id)
  const { data: groups = [], isLoading: isLoadingGroups } = useChatGroups()

  const [selectedId, setSelectedId] = useState<string | null>(defaultTo ?? null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const partners = isCoach 
    ? athletes 
    : [
        ...(coachProfile ? [coachProfile] : []),
        ...athletes.filter(a => a.id !== user?.id)
      ]

  const isLoadingPartners = isCoach ? isLoadingAthletes : (isLoadingCoach || isLoadingAthletes)

  useEffect(() => {
    if (!selectedId && !selectedGroupId) {
      if (defaultTo) {
        setSelectedId(defaultTo)
      } else if (isCoach && athletes.length > 0) {
        setSelectedId(athletes[0].id)
      } else if (!isCoach && coachProfile) {
        setSelectedId(coachProfile.id)
      }
    }
  }, [isCoach, athletes, coachProfile, selectedId, selectedGroupId, defaultTo])

  const { data: conversation = [] } = useMessages(user?.id, selectedId, selectedGroupId)
  const sendMessage = useSendMessage()
  const markRead = useMarkMessagesRead()

  useEffect(() => {
    if (selectedId) markRead.mutate(selectedId)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [text, setText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const handleSend = async () => {
    if (!text.trim()) return
    if (!selectedId && !selectedGroupId) return
    setSendError(null)
    try {
      await sendMessage.mutateAsync({
        receiverId: selectedId,
        groupId: selectedGroupId,
        content: text.trim(),
        isUrgent
      })
      setText('')
      setIsUrgent(false)
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send message')
    }
  }

  const filteredPartners = search.trim()
    ? partners.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : partners

  const filteredGroups = search.trim()
    ? groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups

  const selectedPartner = partners.find(p => p.id === selectedId)
  const selectedGroup = groups.find(g => g.id === selectedGroupId)

  return (
    <div className="flex h-[calc(100dvh-130px)] max-w-4xl mx-auto gap-1 lg:gap-4 p-2 lg:p-0 font-sans">
      {/* Sidebar */}
      <div className="w-20 sm:w-64 bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col rounded-[2rem] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between min-h-[60px] bg-black/20">
          <p className="font-black text-white text-[10px] sm:text-xs uppercase tracking-widest hidden sm:flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" /> Messages
          </p>
          <div className="flex items-center gap-1 ml-auto">
            {showSearch ? (
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Find…"
                  className="w-full pl-4 pr-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/40 focus:bg-white/5 transition-all shadow-inner"
                />
                <button onClick={() => { setSearch(''); setShowSearch(false) }} className="text-gray-500 hover:text-white p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => setShowSearch(true)} className="p-2 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                  <Search className="h-4 w-4" />
                </button>
                <button onClick={() => setShowCreateGroup(true)} className="p-2 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Groups Section */}
          {filteredGroups.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Groups</p>
              {filteredGroups.map(group => {
                const isSelected = selectedGroupId === group.id
                return (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedId(null); setSelectedGroupId(group.id) }}
                    className={cn(
                      'w-full flex items-center justify-center sm:justify-start gap-3 px-2 sm:px-4 py-3.5 transition-all border-l-2',
                      isSelected 
                        ? 'bg-white/10 border-l-white shadow-[inset_10px_0_30px_-10px_rgba(255,255,255,0.1)]' 
                        : 'bg-transparent border-l-transparent hover:bg-white/5'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black tracking-widest flex-shrink-0 transition-all border',
                      isSelected 
                        ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' 
                        : 'bg-black/40 text-gray-400 border-white/10'
                    )}>
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 hidden sm:block text-left">
                      <p className={cn('font-black text-xs uppercase tracking-widest truncate transition-colors', isSelected ? 'text-white' : 'text-gray-400')}>
                        {group.name}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* DM Section */}
          <div className="py-2">
            <p className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Athletes</p>
            {filteredPartners.map(partner => {
              const isSelected = selectedId === partner.id
              return (
                <button
                  key={partner.id}
                  onClick={() => { setSelectedGroupId(null); setSelectedId(partner.id) }}
                  className={cn(
                    'w-full flex items-center justify-center sm:justify-start gap-3 px-2 sm:px-4 py-3.5 transition-all border-l-2',
                    isSelected 
                      ? 'bg-white/10 border-l-white shadow-[inset_10px_0_30px_-10px_rgba(255,255,255,0.1)]' 
                      : 'bg-transparent border-l-transparent hover:bg-white/5'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black tracking-widest flex-shrink-0 transition-all border',
                    isSelected 
                      ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' 
                      : 'bg-black/40 text-gray-400 border-white/10'
                  )}>
                    {getInitials(partner.name)}
                  </div>
                  <div className="flex-1 min-w-0 hidden sm:block text-left">
                    <p className={cn('font-black text-xs uppercase tracking-widest truncate transition-colors', isSelected ? 'text-white' : 'text-gray-400')}>
                      {partner.name}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {(isLoadingPartners || isLoadingGroups) && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 p-6 text-center">Loading...</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="bg-black/20 border-b border-white/10 px-5 py-4 flex items-center gap-4 min-h-[60px]">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-black text-white tracking-widest shadow-inner">
            {selectedGroup ? <Users className="h-4 w-4" /> : selectedPartner ? getInitials(selectedPartner.name) : <Hexagon className="h-4 w-4 opacity-50" />}
          </div>
          <div>
            <p className="font-black text-white text-sm uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              {selectedGroup?.name || selectedPartner?.name || 'No selection'}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">
              {selectedGroup ? 'Group Chat' : selectedPartner ? `DM with ${selectedPartner.role}` : 'Select to start chatting'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          {conversation.map(msg => {
            const isMine = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                {!isMine && selectedGroupId && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 mb-1 text-gray-500">
                    {msg.sender?.name}
                  </span>
                )}
                <div className={cn(
                  'max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 text-sm flex flex-col relative',
                  isMine
                    ? 'bg-white text-black rounded-br-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    : 'bg-black/60 text-gray-200 rounded-bl-sm border border-white/10 shadow-inner'
                )}>
                  {msg.is_urgent && (
                    <div className={cn('flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2', isMine ? 'text-orange-600' : 'text-orange-400')}>
                      <AlertTriangle className="h-3 w-3" /> Urgent
                    </div>
                  )}
                  <p className="leading-relaxed font-medium">{msg.content}</p>
                  <p className={cn('text-[9px] font-bold uppercase tracking-widest mt-2 self-end opacity-60', isMine ? 'text-black' : 'text-gray-400')}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="bg-black/20 border-t border-white/10 px-5 py-4 backdrop-blur-md">
          {sendError && (
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-2 px-1">{sendError}</p>
          )}
          <div className="flex items-center gap-3 mb-3">
             <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 cursor-pointer hover:text-white transition-colors select-none">
              <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} className="peer appearance-none w-4 h-4 border border-white/20 rounded-md bg-black/50 checked:bg-orange-500 checked:border-orange-400 transition-all" />
              <AlertTriangle className={cn("h-3.5 w-3.5", isUrgent ? "text-orange-500" : "text-gray-600")} /> Urgent
            </label>
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Type a message..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="flex-1 bg-black/50 border border-white/10 focus:border-white focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-5 py-3.5 text-sm transition-all shadow-inner outline-none font-medium"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sendMessage.isPending}
              className="bg-white text-black rounded-xl px-5 py-3.5 hover:bg-gray-200 hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] flex-shrink-0 flex items-center justify-center font-black uppercase tracking-widest text-xs gap-2"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroupDialog 
          onClose={() => setShowCreateGroup(false)} 
          onCreated={(id) => { 
            setSelectedId(null); 
            setSelectedGroupId(id); 
            setShowCreateGroup(false); 
          }} 
        />
      )}
    </div>
  )
}

