import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const defaultUrl = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

type SocketEvents = {
  onSlideUpdate?: (slide: number) => void;
  onClassStarted?: () => void;
  onClassStopped?: () => void;
};

export const useSocket = (classId?: string, events: SocketEvents = {}) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const socket = useMemo(() => {
    if (!socketRef.current) {
      socketRef.current = io(defaultUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000,
      });
    }
    return socketRef.current as Socket;
  }, []);

  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnected);
    socket.on('disconnect', handleDisconnect);

    if (classId) {
      socket.emit('join_class', { classId });

      socket.on('slide_update', (payload: { currentSlide: number; classId: string }) => {
        if (payload.classId === classId && events.onSlideUpdate) {
          events.onSlideUpdate(payload.currentSlide);
        }
      });
      socket.on('class_started', (payload: { classId: string }) => {
        if (payload.classId === classId && events.onClassStarted) {
          events.onClassStarted();
        }
      });
      socket.on('class_stopped', (payload: { classId: string }) => {
        if (payload.classId === classId && events.onClassStopped) {
          events.onClassStopped();
        }
      });
    }

    return () => {
      socket.off('connect', handleConnected);
      socket.off('disconnect', handleDisconnect);
      if (classId) {
        socket.emit('leave_class', { classId });
        socket.off('slide_update');
        socket.off('class_started');
        socket.off('class_stopped');
      }
    };
  }, [socket, classId, events.onSlideUpdate, events.onClassStarted, events.onClassStopped]);

  return { socket, connected };
};
