import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
	res.send('Express server is running');
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});