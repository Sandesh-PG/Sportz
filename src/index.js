import express from	 'express';
import http from 'node:http';
import { matchesRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

const server = http.createServer(app);

app.use(express.json());

app.get('/', (req, res) => {
	res.send('Welcome to the Sportz API');
});

app.use('/matches', matchesRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
	const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
	console.log(`Server is running on baseURL ${baseUrl}`);
	console.log(`websocket server is running on ${baseUrl.replace('http', 'ws')}/ws`);
	
});