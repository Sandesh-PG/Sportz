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

  server.on('upgrade', async (req, socket, head) => {
    if (req.url !== '/ws') {
      socket.destroy();
      return;
    }

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          const statusCode = decision.reason.isRateLimit() ? 429 : 403;
          const message = decision.reason.isRateLimit()
            ? 'Too many requests. Please try again later.'
            : 'Access denied.';
          const errorBody = JSON.stringify({ error: message });
          const statusText = statusCode === 429 ? 'Too Many Requests' : 'Forbidden';
          socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\n`);
          socket.write('Content-Type: application/json\r\n');
          socket.write(`Content-Length: ${Buffer.byteLength(errorBody)}\r\n`);
          socket.write('Connection: close\r\n');
          socket.write('\r\n');
          socket.write(errorBody);
          socket.destroy();
          return;
        }
      } catch (error) {
        console.error('Error in Arcjet WebSocket protection:', error);
        const errorBody = JSON.stringify({ error: 'Internal server error' });
        socket.write('HTTP/1.1 500 Internal Server Error\r\n');
        socket.write('Content-Type: application/json\r\n');
        socket.write(`Content-Length: ${Buffer.byteLength(errorBody)}\r\n`);
        socket.write('Connection: close\r\n');
        socket.write('\r\n');
        socket.write(errorBody);
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (socket, request) => {
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