import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Megaphone, Wifi, WifiOff } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import type { ChatMessage } from '@/hooks/useChat';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export default function GroupChat() {
  const { groupId = '' } = useParams<{ groupId: string }>();
  const { user } = useAuthStore();
  const { messages, typingUsers, connected, sendMessage, sendTyping } = useChat(groupId);

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (isAnnouncement = false) => {
    const content = input.trim();
    if (!content) return;
    sendMessage(content, isAnnouncement);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      sendTyping();
    }
  };

  const isGuide = user?.role === 'GUIDE';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-card rounded-t-2xl">
        <div>
          <h2 className="font-bold text-lg">Group Chat</h2>
          <p className="text-xs text-muted-foreground">Group ID: {groupId}</p>
        </div>
        <div className={cn('flex items-center gap-1.5 text-xs font-medium', connected ? 'text-emerald-400' : 'text-rose-400')}>
          {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg: ChatMessage) => {
          const isSelf = msg.sender_id === user?.user_id;
          return (
            <div key={msg.message_id} className={cn('flex flex-col', isSelf ? 'items-end' : 'items-start')}>
              {msg.is_announcement && (
                <div className="flex items-center gap-1 text-xs text-amber-400 mb-1 font-semibold">
                  <Megaphone className="w-3 h-3" /> Announcement
                </div>
              )}
              <div className={cn(
                'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow',
                msg.is_announcement
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100'
                  : isSelf
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-card border border-white/10 rounded-bl-sm'
              )}>
                {!isSelf && (
                  <p className="text-xs font-semibold text-indigo-400 mb-0.5">{msg.sender_email}</p>
                )}
                <p className="leading-relaxed">{msg.content}</p>
                <p className={cn('text-[10px] mt-1', isSelf ? 'text-indigo-200' : 'text-muted-foreground')}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground italic">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 bg-card rounded-b-2xl flex gap-2 items-end">
        <textarea
          className="flex-1 resize-none bg-background/60 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[42px] max-h-[120px]"
          placeholder="Type a message… (Enter to send)"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!connected}
        />
        {isGuide && (
          <button
            onClick={() => handleSend(true)}
            disabled={!connected || !input.trim()}
            title="Send as announcement"
            className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
          >
            <Megaphone className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => handleSend(false)}
          disabled={!connected || !input.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
