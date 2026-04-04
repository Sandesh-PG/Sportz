import { db, pool } from './db/db.js';

async function main() {
	try {
		await db.execute('select 1');
		console.log('Database connection is ready.');
	} catch (err) {
		console.error(err);
	} finally {
		if (pool) await pool.end();
	}
}

await main();