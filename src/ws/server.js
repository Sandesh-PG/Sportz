import { WebSocket, WebSocketServer } from 'ws';

function sendJson(ws, payload) {
    if (ws.readyState !== ws.OPEN) {
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
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024});

    wss.on('connection', (ws) => {
        sendJson(ws, { type: 'welcome', message: 'Welcome to the Sportz WebSocket API' });
    });

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match_created', data: match });
    }

    return { broadcastMatchCreated };

};