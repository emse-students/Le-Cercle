import { Database } from 'bun:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const DB_PATH = process.env.DATABASE_PATH || './data/le_cercle.db';

export let db = loadDatabase();

function loadDatabase(): Database {
	const dir = dirname(DB_PATH);

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	const db = new Database(DB_PATH);

	db.run('PRAGMA foreign_keys = ON');

	const schemaPath = join(process.cwd(), 'src/lib/db/schema.sql');
	const schema = readFileSync(schemaPath, 'utf-8');
	db.run(schema);
	
	console.log("[DB] Database loaded");

	return db;
}

export function reloadDatabase(): void {
	db.close();

	db = loadDatabase();
}