import Database from 'better-sqlite3';
import { fakerFR as faker } from '@faker-js/faker';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const DB_PATH = 'data/le_cercle.db';
const SCHEMA_PATH = join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
const SEED_SQL_PATH = join(process.cwd(), 'src', 'lib', 'db', 'seed.sql');

let db;
// SOFT RESET: Try to clear if busy, otherwise remove
try {
    if (existsSync(DB_PATH)) {
        console.log('🗑️ Trying to remove existing database...');
        unlinkSync(DB_PATH);
    }
    db = new Database(DB_PATH);
} catch (e) {
    if (e.code === 'EBUSY') {
        console.warn('⚠️ Database is busy (probably dev server). Clearing tables instead of deleting file...');
        db = new Database(DB_PATH);
        // We can't easily recreate schema if file exists and we can't delete it?
        // Actually we can, just exec the schema.sql again (it has DROP TABLE IF EXISTS usually, or it will error).
    } else {
        throw e;
    }
}

console.log('🏗️ Initializing schema...');
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

// If busy, we need to clear tables explicitly because CREATE TABLE IF NOT EXISTS won't do it
db.exec(`
    DELETE FROM transactions;
    DELETE FROM perms;
    DELETE FROM noms_perms;
    DELETE FROM boissons;
    DELETE FROM consommables;
    DELETE FROM contenus;
    DELETE FROM contenants;
    DELETE FROM users;
`);

const initialSeed = readFileSync(SEED_SQL_PATH, 'utf-8');
db.exec(initialSeed);

console.log('🌱 Seeding test data...');

// Cleanup is now handled by re-creating the DB

// --- USERS ---
const roles = ['user', 'cercleux'];
const users = [];

console.log('👤 Creating users...');

// 2. Add System Admin (already handled by seed.sql but ensured here)
try {
    const adminSys = db.prepare(`
        INSERT OR IGNORE INTO users (login, nom, prenom, role, promo, solde, statut_cotisation, mail)
        VALUES ('admin', 'System', 'Admin', 'cercleux', '2025', 100.00, 'cotisant_avec_alcool', 'admin@emse.fr')
    `).run();
    if (adminSys.changes > 0) users.push({ id: adminSys.lastInsertRowid, role: 'cercleux', login: 'admin' });
} catch (e) { }

// Get existing users (like les.roots from seed.sql) to populate users array
const existingUsers = db.prepare('SELECT id, role, login FROM users').all();
users.push(...existingUsers);

// 3. Add Dummy Users
for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const login = faker.helpers.slugify(`${firstName.toLowerCase()}.${lastName.toLowerCase()}`).slice(0, 20);
    const role = faker.helpers.arrayElement(roles);

    const existing = db.prepare('SELECT id FROM users WHERE login = ?').get(login);
    if (existing) continue;

    const info = db.prepare(`
        INSERT INTO users (login, nom, prenom, role, promo, solde, statut_cotisation, mail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        login,
        lastName,
        firstName,
        role,
        '20' + faker.number.int({ min: 20, max: 27 }),
        faker.number.float({ min: -10, max: 50, fractionDigits: 2 }),
        faker.helpers.arrayElement(['non_cotisant', 'cotisant_sans_alcool', 'cotisant_avec_alcool']),
        faker.internet.email({ firstName, lastName })
    );
    users.push({ id: info.lastInsertRowid, role, login });
}

// --- ITEMS (Boissons & Consommables) ---
console.log('🍺 Creating items...');

const boissonContenus = ['Chouffe', 'Paix Dieu', 'Coca', 'Ice Tea', 'Jus de Pomme', 'Eau'];
const boissonContenants = [
    { nom: 'Pinte', cap: 500, type: 'verre' },
    { nom: 'Verre', cap: 250, type: 'verre' },
    { nom: 'Ecocup', cap: 330, type: 'verre' },
    { nom: 'Canette', cap: 330, type: 'canette' }
];

// Need Contenus and Contenants tables? 
// The schema.sql uses `contenus` and `contenants` tables for Boissons.
// Let's ensure they exist and check their schema.
// I haven't seen `contenus` table schema but `queries.ts` implies `id_contenu`, `id_contenant`.
// Let's assume they are simple lookups.
// Wait, `createBoisson` takes `id_contenu` and `id_contenant`.
// Do I need to seed `contenus` and `contenants` first?
// `queries.ts` has `getAllContenus`.

// Check if tables exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
const hasContenus = tables.some(t => t.name === 'contenus');

let contenuIds = [];
let contenantIds = [];

if (hasContenus) {
    db.exec('DELETE FROM contenus; DELETE FROM contenants;');

    for (const c of boissonContenus) {
        const isAlcool = ['Chouffe', 'Paix Dieu'].includes(c);
        const info = db.prepare('INSERT INTO contenus (nom, type, degre, description) VALUES (?, ?, ?, ?)').run(c, isAlcool ? 'biere' : 'soft', isAlcool ? 5.0 : 0.0, '');
        contenuIds.push(info.lastInsertRowid);
    }

    for (const c of boissonContenants) {
        const info = db.prepare('INSERT INTO contenants (nom, capacite_ml, type) VALUES (?, ?, ?)').run(c.nom, c.cap, c.type);
        contenantIds.push(info.lastInsertRowid);
    }
}

// Create Boissons (combinations)
const boissons = [];
if (hasContenus) {
    for (const idC of contenuIds) {
        for (const idCnt of contenantIds) {
            const price = faker.number.float({ min: 1, max: 5, fractionDigits: 1 });
            const info = db.prepare(`
                INSERT INTO boissons (id_contenu, id_contenant, prix_vente, prix_achat, nb_plein)
                VALUES (?, ?, ?, ?, ?)
            `).run(idC, idCnt, price, price * 0.6, 100);
            boissons.push({ id: info.lastInsertRowid, price });
        }
    }
}

// Create Consommables
const snacks = [
    { nom: 'Chips', volume: 0 },
    { nom: 'Saucisson', volume: 0 },
    { nom: 'M&Ms', volume: 0 },
    { nom: 'Twix', volume: 0 },
    { nom: 'Bouteille Eau 50cl', volume: 500 }
];
const consommables = [];
for (const s of snacks) {
    const price = faker.number.float({ min: 0.5, max: 2, fractionDigits: 1 });
    const info = db.prepare(`
        INSERT INTO consommables (nom, prix_vente, prix_achat, stock, volume_ml)
        VALUES (?, ?, ?, ?, ?)
    `).run(s.nom, price, price * 0.5, 50, s.volume);
    consommables.push({ id: info.lastInsertRowid, price });
}

// --- PERMS ---
console.log('📅 Creating perms...');

// Past Perms (Last 6 months)
for (let i = 1; i <= 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const ts = Math.floor(date.getTime() / 1000);
    const annee = date.getFullYear().toString();
    const nom = `Perm du ${date.toLocaleDateString('fr-FR')}`;

    const nomInfo = db.prepare('INSERT INTO noms_perms (nom, annee) VALUES (?, ?)').run(nom, annee);
    const idNomPerm = nomInfo.lastInsertRowid;

    const info = db.prepare(`
        INSERT INTO perms (id_nom_perm, date, is_open)
        VALUES (?, ?, 0)
    `).run(idNomPerm, ts);

    const permId = info.lastInsertRowid;

    // Add transactions for this perm
    generateTransactions(permId, ts);
}

// Active Perm
const activeDate = Math.floor(Date.now() / 1000);
const activeNomInfo = db.prepare('INSERT INTO noms_perms (nom, annee) VALUES (?, ?)').run('Perm Actuelle', '2025');
const activePermId = db.prepare(`
    INSERT INTO perms (id_nom_perm, date, is_open)
    VALUES (?, ?, 1)
`).run(activeNomInfo.lastInsertRowid, activeDate).lastInsertRowid;

// Future Perms
for (let i = 1; i <= 2; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i * 7);
    const ts = Math.floor(date.getTime() / 1000);
    const annee = date.getFullYear().toString();

    const nomInfo = db.prepare('INSERT INTO noms_perms (nom, annee) VALUES (?, ?)').run(`Future Perm ${i}`, annee);

    db.prepare(`
        INSERT INTO perms (id_nom_perm, date, is_open)
        VALUES (?, ?, 0)
    `).run(nomInfo.lastInsertRowid, ts);
}

function generateTransactions(permId, dateTs) {
    const numTx = faker.number.int({ min: 10, max: 50 });
    for (let k = 0; k < numTx; k++) {
        const user = faker.helpers.arrayElement(users);
        const isBoisson = faker.datatype.boolean();
        const items = isBoisson ? boissons : consommables;
        if (items.length === 0) continue;

        const item = faker.helpers.arrayElement(items);

        db.prepare(`
            INSERT INTO transactions (id_user, id_debiteur, id_perm, type, id_item, date, prix)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            user.id,
            user.id,
            permId,
            isBoisson ? 'B' : 'C',
            item.id,
            dateTs + faker.number.int({ min: 0, max: 3600 * 4 }), // During the perm (4h)
            item.price
        );
    }
}

// Hors Perm Transactions
console.log('🚀 Generating Hors Perm transactions...');
const adminUser = db.prepare("SELECT id FROM users WHERE login = 'admin'").get();
if (adminUser) {
    for (let k = 0; k < 20; k++) {
        const isBoisson = faker.datatype.boolean();
        const items = isBoisson ? boissons : consommables;
        if (items.length === 0) continue;
        const item = faker.helpers.arrayElement(items);

        db.prepare(`
            INSERT INTO transactions (id_user, id_debiteur, id_perm, type, id_item, date, prix)
            VALUES (?, ?, NULL, ?, ?, ?, ?)
        `).run(
            adminUser.id,
            adminUser.id,
            isBoisson ? 'B' : 'C',
            item.id,
            Math.floor(Date.now() / 1000) - faker.number.int({ min: 0, max: 86400 * 30 }), // Last 30 days
            item.price
        );
    }
}

console.log('✅ Seeding complete!');
