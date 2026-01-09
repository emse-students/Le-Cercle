import db from './index';
import type { User, Transaction, Boisson, Consommable, Perm, Contenu, Contenant } from '$lib/types';

// ========== USERS ==========

export function getUserByLogin(login: string): User | undefined {
	return db.prepare('SELECT * FROM users WHERE login = ?').get(login) as User | undefined;
}

export function getUserById(id: number): User | undefined {
	return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function getAllUsers(): User[] {
	return db.prepare('SELECT * FROM users ORDER BY prenom, nom').all() as User[];
}

export function searchUsers(query: string): User[] {
	const searchPattern = `%${query}%`;
	return db.prepare(`
        SELECT * FROM users 
        WHERE prenom LIKE ? OR nom LIKE ? OR login LIKE ?
        ORDER BY prenom, nom
        LIMIT 20
    `).all(searchPattern, searchPattern, searchPattern) as User[];
}

export function updateUserSolde(userId: number, newSolde: number) {
	return db.prepare('UPDATE users SET solde = ? WHERE id = ?').run(newSolde, userId);
}

export function updateUserRole(userId: number, role: string) {
	return db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
}

export function updateUserStatutCotisation(userId: number, statut: string) {
	return db.prepare('UPDATE users SET statut_cotisation = ? WHERE id = ?').run(statut, userId);
}

export function deleteUser(userId: number) {
	return db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

export function createUser(user: Omit<User, 'id' | 'created_at'>) {
	const stmt = db.prepare(`
        INSERT INTO users (login, mail, prenom, nom, promo, solde, role, statut_cotisation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
	return stmt.run(
		user.login,
		user.mail,
		user.prenom,
		user.nom,
		user.promo,
		user.solde,
		user.role,
		user.statut_cotisation || 'non_cotisant'
	);
}
R = Recharge, id_perm NULL)
	const stmt = db.prepare(`
        INSERT INTO transactions (id_user, id_debiteur, id_perm, type, id_item, date, nb, prix)
        VALUES (?, ?, NULL, 'R', NULL, ?, 1, ?)
    `);

	stmt.run(userId, userId, Math.floor(Date.now() / 1000), amount);rs perm, ou une perm spéciale admin
	// Ici on met 0, attention aux contraintes FK sur transactions(id_perm).
	// Si FK, il faut une perm ID 0 ou NULL.
	// Le schema dit: id_perm INTEGER NOT NULL REFERENCES perms(id).
	// Il faut donc une perm 'Hors Perm' ou similaire existante, ou rendre id_perm nullable.
	// Pour l'instant, assumons qu'on passe un id_perm valide ou 0 si autorisé (sqlite enforce FK by default only if enabled).
	// Le code existant ne semble pas gérer les permissions 'Hors Perm'.
	// Nous allons créer une transaction simple sans perm si possible, ou update juste le solde.
	// Le user demande juste "recharger le compte".

	updateUserSolde(userId, newBalance);
	return newBalance;
}

// ========== PERM BARMANS ==========

export function addBarmanToPerm(permId: number, userId: number) {
	return db.prepare('INSERT INTO perm_barmans (id_perm, id_user) VALUES (?, ?)').run(permId, userId);
}

export function removeBarmanFromPerm(permId: number, userId: number) {
	return db.prepare('DELETE FROM perm_barmans WHERE id_perm = ? AND id_user = ?').run(permId, userId);
}

export function getPermBarmans(permId: number): User[] {
	return db.prepare(`
        SELECT u.* FROM users u
        JOIN perm_barmans pb ON u.id = pb.id_user
        WHERE pb.id_perm = ?
    `).all(permId) as User[];
}

// ========== TRANSACTIONS ==========

export function getUserTransactions(userId: number, limit = 50): Transaction[] {
	return db.prepare(`
        SELECT 
            t.*,
            u.prenom as user_prenom, u.nom as user_nom
        FROM transactions t
        JOIN users u ON t.id_user = u.id
        WHERE t.id_user = ?
        ORDER BY t.date DESC
        LIMIT ?
    `).all(userId, limit) as Transaction[];
}

export function getPermTransactions(permId: number): Transaction[] {
	return db.prepare(`
        SELECT 
            t.*,
            u.prenom as user_prenom, u.nom as user_nom
        FROM transactions t
        JOIN users u ON t.id_user = u.id
        WHERE t.id_perm = ?
        ORDER BY t.date DESC
    `).all(permId) as Transaction[];
}

export function createTransaction(transaction: Omit<Transaction, 'id'>) {
	const stmt = db.prepare(`
        INSERT INTO transactions (id_user, id_debiteur, id_perm, type, id_item, date, nb, prix)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
	const result = stmt.run(
		transaction.id_user,
		transaction.id_debiteur,
		transaction.id_perm,
		transaction.type,
		transaction.id_item,
		transaction.date,
		transaction.nb,
		transaction.prix
	);

	// Mettre à jour le solde de l'utilisateur
	const user = getUserById(transaction.id_user);
	if (user) {
		updateUserSolde(transaction.id_user, user.solde + transaction.prix);
	}

	return result;
}

export function getTransactionsByDateRange(startDate: number, endDate: number, limit = 100): Transaction[] {
	return db.prepare(`
        SELECT 
            t.*,
            u.prenom as user_prenom, u.nom as user_nom,
            d.prenom as debiteur_prenom, d.nom as debiteur_nom
        FROM transactions t
        LEFT JOIN users u ON t.id_user = u.id
        LEFT JOIN users d ON t.id_debiteur = d.id
        WHERE t.date BETWEEN ? AND ?
        ORDER BY t.date DESC
        LIMIT ?
    `).all(startDate, endDate, limit) as Transaction[];
}

export function deleteTransaction(id: number) {
	return db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
}

// ========== BOISSONS ==========

export function createBoisson(boisson: Omit<Boisson, 'id' | 'contenu' | 'contenant'>) {
	const stmt = db.prepare(`
        INSERT INTO boissons (id_contenu, id_contenant, prix_achat, consigne, prix_vente, nb_plein, nb_vide)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
	return stmt.run(
		boisson.id_contenu,
		boisson.id_contenant,
		boisson.prix_achat,
		boisson.consigne,
		boisson.prix_vente,
		boisson.nb_plein || 0,
		boisson.nb_vide || 0
	);
}

export function updateBoisson(id: number, boisson: Partial<Boisson>) {
	const fields: string[] = [];
	const values: (string | number)[] = [];

	if (boisson.id_contenu !== undefined) {
		fields.push('id_contenu = ?'); values.push(boisson.id_contenu);
	}
	if (boisson.id_contenant !== undefined) {
		fields.push('id_contenant = ?'); values.push(boisson.id_contenant);
	}
	if (boisson.prix_achat !== undefined) {
		fields.push('prix_achat = ?'); values.push(boisson.prix_achat);
	}
	if (boisson.consigne !== undefined) {
		fields.push('consigne = ?'); values.push(boisson.consigne);
	}
	if (boisson.prix_vente !== undefined) {
		fields.push('prix_vente = ?'); values.push(boisson.prix_vente);
	}
	if (boisson.nb_plein !== undefined) {
		fields.push('nb_plein = ?'); values.push(boisson.nb_plein);
	}
	if (boisson.nb_vide !== undefined) {
		fields.push('nb_vide = ?'); values.push(boisson.nb_vide);
	}

	if (fields.length === 0) {
		return;
	}

	values.push(id);
	return db.prepare(`UPDATE boissons SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function getAllBoissons(): Boisson[] {
	return db.prepare(`
        SELECT 
            b.*,
            ct.nom as contenu_nom, ct.type as contenu_type, ct.degre as contenu_degre,
            cn.nom as contenant_nom, cn.capacite as contenant_capacite, cn.type as contenant_type
        FROM boissons b
        LEFT JOIN contenus ct ON b.id_contenu = ct.id
        LEFT JOIN contenants cn ON b.id_contenant = cn.id
    `).all() as Boisson[];
}

export function getBoissonById(id: number): Boisson | undefined {
	return db.prepare(`
        SELECT 
            b.*,
            ct.nom as contenu_nom, ct.type as contenu_type, ct.degre as contenu_degre,
            cn.nom as contenant_nom, cn.capacite as contenant_capacite, cn.type as contenant_type
        FROM boissons b
        LEFT JOIN contenus ct ON b.id_contenu = ct.id
        LEFT JOIN contenants cn ON b.id_contenant = cn.id
        WHERE b.id = ?
    `).get(id) as Boisson | undefined;
}

// ========== CONTENUS ==========

export function getAllContenus(): Contenu[] {
	return db.prepare('SELECT * FROM contenus ORDER BY nom').all() as Contenu[];
}

export function getContenuById(id: number): Contenu | undefined {
	return db.prepare('SELECT * FROM contenus WHERE id = ?').get(id) as Contenu | undefined;
}

export function createContenu(contenu: Omit<Contenu, 'id'>) {
	const stmt = db.prepare(`
        INSERT INTO contenus (nom, type, degre, description)
        VALUES (?, ?, ?, ?)
    `);
	return stmt.run(contenu.nom, contenu.type, contenu.degre, contenu.description || '');
}

export function updateContenu(id: number, contenu: Partial<Contenu>) {
	const fields: string[] = [];
	const values: (string | number)[] = [];

	if (contenu.nom !== undefined) {
		fields.push('nom = ?'); values.push(contenu.nom);
	}
	if (contenu.type !== undefined) {
		fields.push('type = ?'); values.push(contenu.type);
	}
	if (contenu.degre !== undefined) {
		fields.push('degre = ?'); values.push(contenu.degre);
	}
	if (contenu.description !== undefined) {
		fields.push('description = ?'); values.push(contenu.description);
	}

	if (fields.length === 0) {
		return;
	}

	values.push(id);
	return db.prepare(`UPDATE contenus SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

// ========== CONTENANTS ==========

export function getAllContenants(): Contenant[] {
	return db.prepare('SELECT * FROM contenants ORDER BY nom').all() as Contenant[];
}

export function createContenant(contenant: Omit<Contenant, 'id'>) {
	const stmt = db.prepare(`
        INSERT INTO contenants (nom, capacite, type)
        VALUES (?, ?, ?)
    `);
	return stmt.run(contenant.nom, contenant.capacite, contenant.type);
}

// ========== CONSOMMABLES ==========

export function getAllConsommables(): Consommable[] {
	return db.prepare('SELECT * FROM consommables ORDER BY nom').all() as Consommable[];
}

export function createConsommable(consommable: Omit<Consommable, 'id'>) {
	const stmt = db.prepare(`
        INSERT INTO consommables (nom, prix_vente)
        VALUES (?, ?)
    `);
	return stmt.run(consommable.nom, consommable.prix_vente);
}

// ========== PERMS ==========

export function getAllPerms(): Perm[] {
	return db.prepare(`
        SELECT p.*, n.nom, n.annee, n.is_active
        FROM perms p
        JOIN noms_perms n ON p.id_nom_perm = n.id
        ORDER BY p.date DESC
    `).all() as Perm[];
}

export function getActivePerm(): Perm | undefined {
	return db.prepare(`
        SELECT p.*, n.nom as nom_perm_nom
        FROM perms p
        LEFT JOIN noms_perms n ON p.id_nom_perm = n.id
        ORDER BY p.date DESC
        LIMIT 1
    `).get() as Perm | undefined;
}

export function getPermById(id: number): Perm | undefined {
	return db.prepare('SELECT * FROM perms WHERE id = ?').get(id) as Perm | undefined;
}

export function createPerm(perm: Omit<Perm, 'id'>) {
	const stmt = db.prepare(`
        INSERT INTO perms (id_nom_perm, date, total_vente, total_litre)
        VALUES (?, ?, ?, ?)
    `);
	return stmt.run(perm.id_nom_perm, perm.date, perm.total_vente, perm.total_litre);
}

// ========== STATS ==========

export function getUserStats(userId: number) {
	return db.prepare(`
        SELECT 
            SUM(CASE WHEN prix < 0 THEN prix ELSE 0 END) as depense,
            COUNT(*) as nb_transactions,
            COUNT(DISTINCT id_perm) as nb_perms
        FROM transactions
        WHERE id_user = ? AND type IN ('B', 'C')
    `).get(userId);
}

export function getGlobalStats() {
	return db.prepare(`
        SELECT 
            SUM(CASE WHEN solde > 0 THEN solde ELSE 0 END) as solde_positif,
            SUM(CASE WHEN solde < 0 THEN solde ELSE 0 END) as solde_negatif,
            COUNT(*) as nb_users,
            COUNT(CASE WHEN droit != 'aucun' THEN 1 END) as nb_cotisants
        FROM users
    `).get();
}

// ========== PERMS MANAGEMENT ==========

export function isUserInPerm(userId: number, permId: number): boolean {
	const permBarman = db.prepare('SELECT id FROM perm_barmans WHERE id_user = ? AND id_perm = ?').get(userId, permId);
	return !!permBarman;
}

export function isPermOpen(permId: number): boolean {
	const perm = db.prepare(`
        SELECT p.id, np.is_active
        FROM perms p
        JOIN noms_perms np ON p.id_nom_perm = np.id
        WHERE p.id = ?
    `).get(permId) as { id: number; is_active: number } | undefined;

	return perm ? perm.is_active === 1 : false;
}

export function getActivePermForUser(userId: number): Perm | undefined {
	return db.prepare(`
        SELECT p.*
        FROM perms p
        JOIN noms_perms np ON p.id_nom_perm = np.id
        JOIN perm_barmans pb ON pb.id_perm = p.id
        WHERE pb.id_user = ? AND np.is_active = 1
        ORDER BY p.date DESC
        LIMIT 1
    `).get(userId) as Perm | undefined;
}

export function openPerm(permId: number) {
	const perm = db.prepare('SELECT id_nom_perm FROM perms WHERE id = ?').get(permId) as { id_nom_perm: number } | undefined;
	if (!perm) {
		throw new Error('Perm not found');
	}

	return db.prepare('UPDATE noms_perms SET is_active = 1 WHERE id = ?').run(perm.id_nom_perm);
}

export function closePerm(permId: number) {
	const perm = db.prepare('SELECT id_nom_perm FROM perms WHERE id = ?').get(permId) as { id_nom_perm: number } | undefined;
	if (!perm) {
		throw new Error('Perm not found');
	}

	return db.prepare('UPDATE noms_perms SET is_active = 0 WHERE id = ?').run(perm.id_nom_perm);
}

export function assignUserToPerm(userId: number, permId: number) {
	return db.prepare('INSERT OR IGNORE INTO perm_barmans (id_user, id_perm) VALUES (?, ?)').run(userId, permId);
}

export function removeUserFromPerm(userId: number, permId: number) {
	return db.prepare('DELETE FROM perm_barmans WHERE id_user = ? AND id_perm = ?').run(userId, permId);
}

export function getPermMembers(permId: number): User[] {
	return db.prepare(`
        SELECT u.*
        FROM users u
        JOIN perm_barmans pb ON u.id = pb.id_user
        WHERE pb.id_perm = ?
    `).all(permId) as User[];
}

export function deletePerm(permId: number) {
	const perm = db.prepare('SELECT id_nom_perm FROM perms WHERE id = ?').get(permId) as { id_nom_perm: number } | undefined;
	if (!perm) {
		throw new Error('Perm not found');
	}

	// Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
	db.prepare('DELETE FROM transactions WHERE id_perm = ?').run(permId);
	db.prepare('DELETE FROM inventaire_perms WHERE id_perm = ?').run(permId);
	db.prepare('DELETE FROM perm_barmans WHERE id_perm = ?').run(permId);
	db.prepare('DELETE FROM perms WHERE id = ?').run(permId);

	const otherPerms = db.prepare('SELECT COUNT(*) as count FROM perms WHERE id_nom_perm = ?').get(perm.id_nom_perm) as { count: number };
	if (otherPerms.count === 0) {
		db.prepare('DELETE FROM noms_perms WHERE id = ?').run(perm.id_nom_perm);
	}

	return { changes: 1 };
}
