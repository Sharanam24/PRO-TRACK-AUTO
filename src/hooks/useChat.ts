import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

export interface ChatMessage {
  message_id: string;
  group_id: string;
  sender_id: string;
  sender_email: string;
  content: string;
  is_announcement: boolean;
  created_at: string;
}

export interface TypingUser {
  user_id: string;
  email: string;
}

export function useChat(groupId: string) {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !groupId) return;

    const socket = io(window.location.origin.replace(/:\d+$/, ':5001'), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', groupId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user_typing', (user: TypingUser) => {
      setTypingUsers((prev) => {
        if (prev.includes(user.email)) return prev;
        return [...prev, user.email];
      });
      // Auto-clear typing indicator after 2 seconds
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((e) => e !== user.email));
      }, 2000);
    });

    socket.on('connection_error', (err: { message: string }) => {
      console.error('[useChat] Connection error:', err.message);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setMessages([]);
      setTypingUsers([]);
    };
  }, [token, groupId]);

  const sendMessage = useCallback(
    (content: string, isAnnouncement = false) => {
      socketRef.current?.emit('send_message', {
        group_id: groupId,
        content,
        is_announcement: isAnnouncement,
      });
    },
    [groupId],
  );

  const sendTyping = useCallback(() => {
    socketRef.current?.emit('typing', groupId);
  }, [groupId]);

  return { messages, typingUsers, connected, sendMessage, sendTyping };
}
