// Script pour réinitialiser la base de données
// Exécuter avec: node scripts/init_db.js

const Database = require('better-sqlite3');
const { readFileSync, mkdirSync, existsSync, unlinkSync } = require('fs');
const { join } = require('path');

// Assurer que le dossier data existe
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'le_cercle.db');
console.log(`Initialisation de la base de données: ${dbPath}`);

// Optionnel: Supprimer l'ancienne DB pour repartir de zéro
// if (existsSync(dbPath)) {
//     unlinkSync(dbPath);
//     console.log('Ancienne base de données supprimée.');
// }

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try {
    // 1. Appliquer le schéma
    const schemaPath = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    console.log(`Loading schema from ${schemaPath}`);
    const schema = readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('Schéma appliqué avec succès.');

    // 2. Appliquer les données de test (Seed)
    const seedPath = join(process.cwd(), 'src', 'lib', 'db', 'seed.sql');
    if (existsSync(seedPath)) {
        console.log(`Loading seed from ${seedPath}`);
        const seed = readFileSync(seedPath, 'utf-8');
        db.exec(seed);
        console.log('Données de seed insérées.');
    } else {
        console.log('Aucun fichier seed.sql trouvé.');
    }
} catch (err) {
    console.error('Erreur lors de l\'initialisation:', err);
} finally {
    db.close();
}
