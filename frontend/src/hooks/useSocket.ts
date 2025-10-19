import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const defaultUrl = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

type SocketEvents = {
  onSlideUpdate?: (slide: number) => void;
  onClassStarted?: () => void;
  onClassStopped?: () => void;
  onPresentationData?: (payload: {
    classId?: string;
    currentSlide?: number;
    totalSlides?: number;
    slides?: unknown;
    pdfBase64?: string | null;
    title?: string;
  }) => void;
};

export const useSocket = (classId?: string, events: SocketEvents = {}) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);

  // Keep events ref updated without causing re-renders
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

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
    const handleConnected = () => {
      console.log('Socket connected');
      setConnected(true);
    };
    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setConnected(false);
    };

    socket.on('connect', handleConnected);
    socket.on('disconnect', handleDisconnect);
    const handleAny = (event: string, ...args: unknown[]) => {
      console.log('Socket event received:', event, args);
    };
    socket.onAny(handleAny);

    return () => {
      socket.off('connect', handleConnected);
      socket.off('disconnect', handleDisconnect);
      socket.offAny(handleAny);
    };
  }, [socket]);

  useEffect(() => {
    if (!classId || !connected) {
      return;
    }

    console.log('Joining class room:', classId);
    socket.emit('join_class', { classId });

    const handleSlideUpdate = (payload: { currentSlide: number; classId: string }) => {
      console.log('Received slide_update event:', payload);
      if (payload.classId === classId) {
        console.log('useSocket: updating slide to', payload.currentSlide);
        eventsRef.current.onSlideUpdate?.(payload.currentSlide);
      }
    };

    const handlePresentationData = (payload: {
      classId?: string;
      currentSlide?: number;
      totalSlides?: number;
      slides?: unknown;
      pdfBase64?: string | null;
      title?: string;
    }) => {
      console.log('Received presentation_data event:', payload);
      if (!payload.classId || payload.classId !== classId) {
        return;
      }
      eventsRef.current.onPresentationData?.(payload);
    };

    const handleClassStarted = (payload: { classId: string }) => {
      console.log('Received class_started event:', payload);
      if (payload.classId === classId && eventsRef.current.onClassStarted) {
        eventsRef.current.onClassStarted();
      }
    };

    const handleClassStopped = (payload: { classId: string }) => {
      console.log('Received class_stopped event:', payload);
      if (payload.classId === classId && eventsRef.current.onClassStopped) {
        eventsRef.current.onClassStopped();
      }
    };

    socket.on('slide_update', handleSlideUpdate);
    socket.on('class_started', handleClassStarted);
    socket.on('class_stopped', handleClassStopped);
    socket.on('presentation_data', handlePresentationData);

    return () => {
      console.log('Leaving class room:', classId);
      socket.emit('leave_class', { classId });
      socket.off('slide_update', handleSlideUpdate);
      socket.off('class_started', handleClassStarted);
      socket.off('class_stopped', handleClassStopped);
      socket.off('presentation_data', handlePresentationData);
    };
  }, [socket, classId, connected]);

  return { socket, connected };
};
