import { useEffect, useRef } from 'react';

const WS_ENDPOINT = import.meta.env.DEV
  ? 'ws://localhost:10000/ws'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export default function useMatchesWebSocket(onMessage) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const socket = new WebSocket(WS_ENDPOINT);

    socket.onopen = () => {
      console.log('🔌 Matches WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        console.log('📨 Matches WS update:', message);

        onMessageRef.current?.(message);
      } catch (error) {
        console.error('❌ Invalid WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ Matches WebSocket error:', error);
    };

    socket.onclose = (event) => {
      console.log(
        '🔌 Matches WebSocket disconnected',
        event.code,
        event.reason,
      );
    };

    return () => {
      socket.close();
    };
  }, []);
}