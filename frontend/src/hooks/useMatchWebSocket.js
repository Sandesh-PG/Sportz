import { useCallback, useEffect, useRef, useState } from 'react';

const WS_ENDPOINT = import.meta.env.DEV
  ? 'ws://localhost:10000/ws'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export default function useMatchWebSocket(matchId, onMessage) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!matchId) return;

    const socket = new WebSocket(WS_ENDPOINT);

    socketRef.current = socket;
    setIsConnected(false);
    setIsSubscribed(false);

    socket.onopen = () => {
      console.log(`🔌 WS connected for match ${matchId}`);
      setIsConnected(true);

      const message = {
        type: 'subscribe',
        matchId: Number(matchId),
      };

      console.log('📤 Auto-subscribing to match:', message);

      socket.send(JSON.stringify(message));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        console.log('📨 WS update:', message);

        if (message.type === 'subscribed') {
          setIsSubscribed(true);
        }

        if (message.type === 'unsubscribed') {
          setIsSubscribed(false);
        }

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

      setIsConnected(false);
      setIsSubscribed(false);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [matchId]);

  const subscribe = useCallback(() => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket is not connected yet.');
      return;
    }

    const message = {
      type: 'subscribe',
      matchId: Number(matchId),
    };

    console.log('📤 Subscribing to match:', message);

    socket.send(JSON.stringify(message));
  }, [matchId]);

  const unsubscribe = useCallback(() => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'unsubscribe',
      matchId: Number(matchId),
    };

    console.log('📤 Unsubscribing from match:', message);

    socket.send(JSON.stringify(message));
  }, [matchId]);

  return {
    socketRef,
    isConnected,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
}