import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Créer le dossier data s'il n'existe pas
if (!existsSync('data')) {
	mkdirSync('data', { recursive: true });
}

const db = new Database('data/le_cercle.db');

// Mode journal simple (un seul fichier .db)
db.pragma('journal_mode = DELETE');
db.pragma('foreign_keys = ON');

// Initialisation du schéma
try {
	const schema = readFileSync(join(process.cwd(), 'src', 'lib', 'db', 'schema.sql'), 'utf-8');
	db.exec(schema);

	// Données initiales (cotisations)
	const seed = readFileSync(join(process.cwd(), 'src', 'lib', 'db', 'seed.sql'), 'utf-8');
	db.exec(seed);
} catch (err) {
	console.error('Erreur initialisation base de données:', err);
}

export default db;
