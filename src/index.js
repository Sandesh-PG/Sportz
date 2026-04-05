import AgentAPI from 'apminsight';
AgentAPI.config();

import express from	 'express';
import http from 'node:http';
import { matchesRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';
import { commentaryRouter } from './routes/commantary.js';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

const server = http.createServer(app);

app.use(express.json());

app.get('/', (req, res) => {
	res.send('Welcome to the Sportz API');
});

app.use(securityMiddleware());

app.use('/matches', matchesRouter);
app.use('/matches/:id/commentary', commentaryRouter);

const { broadcastMatchCreated, broadCastCommantary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommantary = broadCastCommantary;


server.listen(PORT, HOST, () => {
	const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
	console.log(`Server is running on baseURL ${baseUrl}`);
	console.log(`websocket server is running on ${baseUrl.replace('http', 'ws')}/ws`);
	
});