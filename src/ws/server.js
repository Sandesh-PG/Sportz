import { WebSocket, WebSocketServer } from 'ws';
import { wsArcjet } from '../arcjet.js';

function sendJson(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) {
        return;
    }

    ws.send(JSON.stringify(payload)); 
}

function broadcast(wss, payload) {
    wss.clients.forEach(client => {
        if(client.readyState !== WebSocket.OPEN) {
            return;
        }
        client.send(JSON.stringify(payload));
    }); 
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

    sendJson(socket, { type: 'welcome' });

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
    broadcast(wss, { type: 'match_created', data: match });
  }

  return { broadcastMatchCreated };
}