import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const db = new Database('data/le_cercle.db');

// Enable WAL mode for concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
try {
	const schema = readFileSync(join(process.cwd(), 'src', 'lib', 'db', 'schema.sql'), 'utf-8');
	db.exec(schema);
	console.debug('Database schema initialized.');
} catch (err) {
	console.error('Failed to initialize database schema:', err);
}

export default db;
