import express from	 'express';
import { matchesRouter } from './routes/matches.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
	res.send('Welcome to the Sportz API');
});

app.use('/matches', matchesRouter);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});