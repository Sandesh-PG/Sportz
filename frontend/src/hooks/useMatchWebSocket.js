import { useEffect, useRef } from 'react';

const WS_ENDPOINT = import.meta.env.DEV
  ? 'ws://localhost:10000/ws'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export default function useMatchWebSocket(matchId, onMessage) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!matchId) return;

    const socket = new WebSocket(WS_ENDPOINT);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log(`🔌 WS connected for match ${matchId}`);

      const message = {
        type: 'subscribe',
        matchId: Number(matchId),
      };

      console.log('📤 Sending WS subscription:', message);

      socket.send(JSON.stringify(message));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        console.log('📨 WS update:', message);

        onMessageRef.current?.(message);
      } catch (error) {
        console.error('❌ Invalid WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    socket.onclose = (event) => {
      console.log(
        `🔌 WS disconnected for match ${matchId}`,
        event.code,
        event.reason,
      );
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [matchId]);

  return socketRef;
}