import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../arcjet.js';

const matchSubscribers = new Map();

function subscribe(matchId, ws) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId).add(ws);
}

function unsubscribe(matchId, ws) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;

  subscribers.delete(ws); // this line was missing before
  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

function cleanUpSubscriptions(ws) {
  for (const [matchId, subscribers] of matchSubscribers.entries()) {
    if (subscribers.delete(ws) && subscribers.size === 0) {
      matchSubscribers.delete(matchId);
    }
  }
}

function sendJson(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function broadcastToMatch(matchId, payload) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;

  const message = JSON.stringify(payload);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastToAll(wss, payload) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function handleMessage(ws, data) {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch {
    console.error('Invalid JSON message received');
    return;
  }

  // Accept "3" as well as 3: useParams() in React gives strings.
  const matchId = Number(message?.matchId);
  if (!Number.isInteger(matchId) || matchId <= 0) return;

  if (message.type === 'subscribe') {
    subscribe(matchId, ws);
    ws.subscriptions.add(matchId);
    sendJson(ws, { type: 'subscribed', matchId });
    return;
  }

  if (message.type === 'unsubscribe') {
    unsubscribe(matchId, ws);
    ws.subscriptions.delete(matchId);
    sendJson(ws, { type: 'unsubscribed', matchId });
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024,
  });

  wss.on('connection', async (socket, request) => {
    // Set up the socket immediately so messages aren't lost while Arcjet runs.
    socket.isAlive = true;
    socket.subscriptions = new Set();

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('message', (data) => handleMessage(socket, data));

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    socket.on('close', () => {
      cleanUpSubscriptions(socket);
    });

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(request);

        if (decision.isDenied()) {
          const rateLimited = decision.reason.isRateLimit();
          socket.close(
            rateLimited ? 1013 : 1008,
            rateLimited ? 'Too many requests. Please try again later.' : 'Access denied.',
          );
          return;
        }
      } catch (error) {
        console.error('Error in Arcjet WebSocket protection:', error);
        socket.close(1011, 'Internal server error');
        return;
      }
    }

    sendJson(socket, { type: 'welcome' });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  // -> everyone
  function broadcastMatchCreated(match) {
    broadcastToAll(wss, { type: 'match_created', data: match });
  }

  // -> everyone (no subscription needed): lightweight score only, no commentary
  function broadcastScore(data) {
    broadcastToAll(wss, { type: 'score_update', data });
  }

  // -> everyone: a match changed status or was re-scheduled
  function broadcastMatchUpdated(match) {
    broadcastToAll(wss, { type: 'match_updated', data: match });
  }

  // -> only sockets that subscribed to this match
  function broadCastCommantary(matchId, commentary) {
    broadcastToMatch(matchId, { type: 'commentary_update', data: commentary });
  }

  return { broadcastMatchCreated, broadcastMatchUpdated, broadcastScore, broadCastCommantary };
}