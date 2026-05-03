import { Database } from 'bun:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';

const DB_PATH = process.env.DATABASE_PATH || './data/le_cercle.db';

type Statement = {
	get: (...params: unknown[]) => unknown;
	all: (...params: unknown[]) => unknown[];
	run: (...params: unknown[]) => { changes: number; lastInsertRowid: number };
};

type DatabaseInstance = {
	prepare: (sql: string) => Statement;
	exec: (sql: string) => void;
	run?: (sql: string) => void;
	close?: () => void;
};

export let db: DatabaseInstance = getDatabase();

function getDatabase(): DatabaseInstance {
	const dir = dirname(DB_PATH);

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	let dbInstance: DatabaseInstance;

	const require = createRequire(import.meta.url);

	// const { Database } = require('bun:sqlite') as {
	// 	Database: new (path: string) => DatabaseInstance;
	// };
	dbInstance = new Database(DB_PATH) as DatabaseInstance;

	try {
		dbInstance.exec('PRAGMA foreign_keys = ON');
	} catch {
		void 0;
	}

	const schemaPath = join(process.cwd(), 'src/lib/db/schema.sql');
	const schema = readFileSync(schemaPath, 'utf-8');
	dbInstance.exec(schema);
	
	console.log("[DB] Database loaded");

	return dbInstance;
}