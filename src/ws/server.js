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
  if(!subscribers){
    return
  }

  if (matchSubscribers.get(matchId).size === 0) {
    matchSubscribers.delete(matchId);
  } 

}

function cleanUpSubscriptions(ws) {
    for (const [matchId, subscribers] of matchSubscribers.entries()) {
        if (subscribers.has(ws)) {
            subscribers.delete(ws);
            if (subscribers.size === 0) {
                matchSubscribers.delete(matchId);
            }
        }
    }
}

function sendJson(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) {
        return;
    }

    ws.send(JSON.stringify(payload)); 
}

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers) {
        return;
    }
    const message = JSON.stringify(payload);

    for(const client of subscribers) {
      if(client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    };
}

function broadcastToAll(wss, payload) {
    wss.clients.forEach(client => {
        if(client.readyState !== WebSocket.OPEN) {
            return;
        }
        client.send(JSON.stringify(payload));
    }); 
}

function handleMessage(ws, data) {
  let message;
  try {
    message = JSON.parse(data.toString());
  } catch (error) {
    console.error('Invalid JSON message received:', message);
    return;
  }

  if(message?.type === 'subscribe' && Number.isInteger(message.matchId)) {
    subscribe(message.matchId, ws);
    ws.subscriptions.add(message.matchId);
    sendJson(ws, { type: 'subscribed', matchId: message.matchId });
    return;
  }

  if(message?.type === 'unsubscribe' && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, ws);
    ws.subscriptions.delete(message.matchId);
    sendJson(ws, { type: 'unsubscribed', matchId: message.matchId });
    return;
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 });

  wss.on('connection', async (socket, request) => {
    if(wsArcjet) {
      try{
        const decision = await wsArcjet.protect(request);
        if(decision.isDenied()){
          const code = decision.reason.isRateLimit() ? 1013 : 1008; // 1013: Try Again Later, 1008: Policy Violation
          const reason = decision.reason.isRateLimit() ? 'Too many requests. Please try again later.' : 'Access denied.';
          socket.close(code, reason);
          return;
        }
      }
      catch (error) {
        console.error('Error in Arcjet WebSocket protection:', error);
        socket.close(1011, 'Internal server error');
        return;
      }
    }
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });

    socket.subscriptions = new Set();
    sendJson(socket, { type: 'welcome' });

    socket.on('message', (data) => handleMessage(socket, data));
    socket.on('error', (error) => socket.terminate());
    socket.on('close', () => cleanUpSubscriptions(socket));

    socket.on('error', console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  function broadcastMatchCreated(match) {
    broadcastToAll(wss, { type: 'match_created', data: match });
  }

  function broadCastCommantary(matchId, commentary) {
    broadcastToMatch(matchId, { type: 'commentary_update', data: commentary });
  }

  return { broadcastMatchCreated, broadCastCommantary };
}