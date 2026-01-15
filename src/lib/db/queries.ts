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
	// Supprimer les dépendances pour éviter les erreurs de clé étrangère
	db.prepare('DELETE FROM perm_barmans WHERE id_user = ?').run(userId);
	db.prepare('DELETE FROM transactions WHERE id_user = ? OR id_debiteur = ?').run(userId, userId);
	db.prepare('DELETE FROM year_stats WHERE id_user = ?').run(userId);

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

export function rechargeBalance(userId: number, amount: number) {
	const user = getUserById(userId);
	if (!user) {
		throw new Error('User not found');
	}
	const newBalance = user.solde + amount;

	// Transaction de recharge (Type R = Recharge, id_perm NULL)
	const stmt = db.prepare(`
        INSERT INTO transactions (id_user, id_debiteur, id_perm, type, id_item, date, nb, prix)
        VALUES (?, ?, NULL, 'R', NULL, ?, 1, ?)
    `);

	stmt.run(userId, userId, Math.floor(Date.now() / 1000), amount);

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
            u.prenom as user_prenom, u.nom as user_nom,
            -- Boisson Info
            co.nom as boisson_nom,
            ct.nom as contenant_nom,
            -- Consommable info
            con.nom as consommable_nom
        FROM transactions t
        JOIN users u ON t.id_user = u.id
        LEFT JOIN boissons b ON t.type = 'B' AND t.id_item = b.id
        LEFT JOIN contenus co ON b.id_contenu = co.id
        LEFT JOIN contenants ct ON b.id_contenant = ct.id
        LEFT JOIN consommables con ON t.type = 'C' AND t.id_item = con.id
        WHERE t.id_user = ?
        ORDER BY t.date DESC
        LIMIT ?
    `).all(userId, limit) as Transaction[];
}

export function getTransactionDetails(t: any) {
	if (t.type === 'R') {
		return 'Rechargement';
	}
	if (t.type === 'B') {
		return `${t.boisson_nom || '?'} ${t.contenant_nom || '?'}`;
	}
	if (t.type === 'C') {
		return t.consommable_nom || '?';
	}
	return 'Transaction';
}

export function getPermTransactions(permId: number): Transaction[] {
	return db.prepare(`
        SELECT 
            t.*,
            u.prenom as user_prenom, u.nom as user_nom,
            -- Boisson Info
            co.nom as boisson_nom, co.degre as boisson_degre,
            ct.nom as contenant_nom, ct.capacite_ml as contenant_capacite,
            b.prix_achat as boisson_prix_achat, b.icone as boisson_icone,
            -- Consommable info
            con.nom as consommable_nom, con.prix_achat as consommable_prix_achat, con.icone as consommable_icone, con.volume_ml as consommable_volume
        FROM transactions t
        JOIN users u ON t.id_user = u.id
        LEFT JOIN boissons b ON t.type = 'B' AND t.id_item = b.id
        LEFT JOIN contenus co ON b.id_contenu = co.id
        LEFT JOIN contenants ct ON b.id_contenant = ct.id
        LEFT JOIN consommables con ON t.type = 'C' AND t.id_item = con.id
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

	// Mettre à jour le total de la permanence si applicable
	if (transaction.id_perm) {
		const prixAbs = Math.abs(transaction.prix);
		let volumeAbs = 0;

		// Si c'est une boisson, on peut essayer de mettre à jour le volume consommé si c'est pertinent
		if (transaction.type === 'B') {
			const boisson = getBoissonById(transaction.id_item);
			if (boisson && boisson.contenant_capacite) {
				volumeAbs = transaction.nb * boisson.contenant_capacite;
			}
		}

		db.prepare(`
            UPDATE perms 
            SET total_vente = total_vente + ?, 
                total_litre = total_litre + ? 
            WHERE id = ?
        `).run(prixAbs, volumeAbs, transaction.id_perm);
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
        INSERT INTO contenants (nom, capacite_ml, type)
        VALUES (?, ?, ?)
    `);
	return stmt.run(contenant.nom, contenant.capacite_ml, contenant.type);
}

// ========== PERMS ==========

export function getAllPerms(): Perm[] {
	return db.prepare(`
        SELECT 
            p.*, n.nom, n.annee, n.is_active as is_open,
            (SELECT SUM(ABS(t.prix) - (t.nb * COALESCE(b.prix_achat, con.prix_achat, 0))) 
             FROM transactions t 
             LEFT JOIN boissons b ON t.type = 'B' AND t.id_item = b.id
             LEFT JOIN consommables con ON t.type = 'C' AND t.id_item = con.id
             WHERE t.id_perm = p.id AND t.type IN ('B', 'C')) as total_profit
        FROM perms p
        JOIN noms_perms n ON p.id_nom_perm = n.id
        ORDER BY p.date DESC
    `).all() as (Perm & { total_profit: number })[];
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

// ========== BOISSONS ==========

export function getAllBoissons(): Boisson[] {
	return db.prepare(`
        SELECT 
            b.*,
            c.nom as contenu_nom, c.degre as contenu_degre, c.type as contenu_type, c.description as contenu_description,
            ct.nom as contenant_nom, ct.capacite_ml as contenant_capacite, ct.type as contenant_type
        FROM boissons b
        JOIN contenus c ON b.id_contenu = c.id
        JOIN contenants ct ON b.id_contenant = ct.id
        ORDER BY c.nom
    `).all() as Boisson[];
}

export function getBoissonById(id: number): Boisson | undefined {
	return db.prepare(`
        SELECT 
            b.*,
            c.nom as contenu_nom, c.degre as contenu_degre, c.description as contenu_description,
            ct.nom as contenant_nom, ct.capacite_ml as contenant_capacite, ct.type as contenant_type
        FROM boissons b
        JOIN contenus c ON b.id_contenu = c.id
        JOIN contenants ct ON b.id_contenant = ct.id
        WHERE b.id = ?
    `).get(id) as Boisson | undefined;
}

export function createBoisson(boisson: Omit<Boisson, 'id' | 'contenu' | 'contenant'>) {
	const stmt = db.prepare(`
        INSERT INTO boissons (id_contenu, id_contenant, prix_achat, consigne, prix_vente, nb_plein, nb_vide, nb_commande, volume_restant, icone, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
	return stmt.run(
		boisson.id_contenu,
		boisson.id_contenant,
		boisson.prix_achat,
		boisson.consigne,
		boisson.prix_vente,
		boisson.nb_plein || 0,
		boisson.nb_vide || 0,
		boisson.nb_commande || 0,
		boisson.volume_restant || 0,
		boisson.icone || 'Beer',
		boisson.description || null
	);
}

export function updateBoisson(id: number, boisson: Partial<Boisson>) {
	const fields: string[] = [];
	const values: (string | number | null)[] = [];

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
	if (boisson.nb_commande !== undefined) {
		fields.push('nb_commande = ?'); values.push(boisson.nb_commande);
	}
	if (boisson.volume_restant !== undefined) {
		fields.push('volume_restant = ?'); values.push(boisson.volume_restant);
	}
	if (boisson.icone !== undefined) {
		fields.push('icone = ?'); values.push(boisson.icone);
	}
	if (boisson.description !== undefined) {
		fields.push('description = ?'); values.push(boisson.description);
	}

	if (fields.length === 0) {
		return;
	}

	values.push(id);
	return db.prepare(`UPDATE boissons SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteBoisson(id: number) {
    // Check dependencies...
    // For now, if it's in a transaction or carte_perm, we might have issues.
    // Ideally we should soft delete or block if used.
    // Simple verification: if used in transactions, throw error.
    const usedInTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE type = "B" AND id_item = ?').get(id) as { count: number };
    if (usedInTransactions.count > 0) {
        throw new Error("Impossible de supprimer cette boisson car elle a déjà été vendue.");
    }
    
    // Remove from carte_perm
    db.prepare('DELETE FROM carte_perm WHERE type = "B" AND id_item = ?').run(id);

    return db.prepare('DELETE FROM boissons WHERE id = ?').run(id);
}

// ========== CONSOMMABLES ==========

export function getAllConsommables(): Consommable[] {
	return db.prepare('SELECT * FROM consommables ORDER BY nom').all() as Consommable[];
}

export function getConsommableById(id: number): Consommable | undefined {
	return db.prepare('SELECT * FROM consommables WHERE id = ?').get(id) as Consommable | undefined;
}

export function createConsommable(consommable: Omit<Consommable, 'id'>) {
	const stmt = db.prepare(`
        INSERT INTO consommables (nom, prix_vente, prix_achat, stock, volume_ml, icone, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
	return stmt.run(
		consommable.nom,
		consommable.prix_vente,
		consommable.prix_achat || 0,
		consommable.stock || 0,
		consommable.volume_ml || 0,
		consommable.icone || 'Utensils',
		consommable.description || null
	);
}

export function updateConsommable(id: number, consommable: Partial<Consommable>) {
	const fields: string[] = [];
	const values: (string | number | null)[] = [];

	if (consommable.nom !== undefined) {
		fields.push('nom = ?'); values.push(consommable.nom);
	}
	if (consommable.prix_vente !== undefined) {
		fields.push('prix_vente = ?'); values.push(consommable.prix_vente);
	}
	if (consommable.prix_achat !== undefined) {
		fields.push('prix_achat = ?'); values.push(consommable.prix_achat);
	}
	if (consommable.stock !== undefined) {
		fields.push('stock = ?'); values.push(consommable.stock);
	}
	if (consommable.volume_ml !== undefined) {
		fields.push('volume_ml = ?'); values.push(consommable.volume_ml);
	}
	if (consommable.icone !== undefined) {
		fields.push('icone = ?'); values.push(consommable.icone);
	}
	if (consommable.description !== undefined) {
		fields.push('description = ?'); values.push(consommable.description);
	}

	if (fields.length === 0) {
		return;
	}

	values.push(id);
	return db.prepare(`UPDATE consommables SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteConsommable(id: number) {
     const usedInTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE type = "C" AND id_item = ?').get(id) as { count: number };
    if (usedInTransactions.count > 0) {
        throw new Error("Impossible de supprimer ce consommable car il a déjà été vendu.");
    }

    // Remove from carte_perm
    db.prepare('DELETE FROM carte_perm WHERE type = "C" AND id_item = ?').run(id);

    return db.prepare('DELETE FROM consommables WHERE id = ?').run(id);
}

// ========== STATS & BILAN ==========

export function getPermStats(permId: number) {
	// Requires joining transactions with item details
	// Only 'B' (Boissons) and 'C' (Consommables) types are relevant for sales stats
	const transactions = db.prepare(`
        SELECT 
            t.type, t.id_item, t.nb, t.prix,
            -- Boisson Info
            c.nom as boisson_nom,
            ct.nom as contenant_nom,
            ct.capacite as contenant_capacite,
            -- Consommable info
            con.nom as consommable_nom
        FROM transactions t
        LEFT JOIN boissons b ON t.type = 'B' AND t.id_item = b.id
        LEFT JOIN contenus c ON b.id_contenu = c.id
        LEFT JOIN contenants ct ON b.id_contenant = ct.id
        LEFT JOIN consommables con ON t.type = 'C' AND t.id_item = con.id
        WHERE t.id_perm = ? AND t.type IN ('B', 'C')
    `).all(permId) as any[];

	// Aggregate in JS to simplify (DB query can get complex with multiple joins)
	const stats = new Map<string, {
        nom: string,
        contenant: string,
        count: number,
        total_litre: number,
        total_prix: number
    }>();

	for (const t of transactions) {
		const isBoisson = t.type === 'B';
		const nom = isBoisson ? t.boisson_nom : t.consommable_nom;
		const contenant = isBoisson ? t.contenant_nom : 'Unité';
		const capacite = isBoisson ? (t.contenant_capacite || 0) : 0;

		const key = `${t.type}_${t.id_item}`;

		if (!stats.has(key)) {
			stats.set(key, {
				nom: nom || 'Inconnu',
				contenant: contenant || '-',
				count: 0,
				total_litre: 0,
				total_prix: 0
			});
		}

		const entry = stats.get(key)!;
		entry.count += t.nb;
		entry.total_prix += t.prix;
		if (isBoisson) {
			entry.total_litre += (t.nb * capacite); // Assuming t.nb is usually 1, but if we sell "pints" from a keg, is 'nb' the number of glasses?
			// If it is a keg, transaction usually represents 1 glass.
			// In SQL schema, 'nb' is count.
			// Currently transactions don't store volume served, just 'nb'.
			// Assuming 'contenant_capacite' is the volume of the container SOLD.
			// If we sell a 'inte' (0.5L) from a keg, the 'boisson' item should represent the 'Pinte', not the 'Fût'.
			// However, typical Le Cercle model: Item = "Fût de Chouffe". Selling it means... what?
			// If they sell glasses, they usually have a Boisson "Demi Chouffe" and "Pinte Chouffe" which are 'verre' containers.
			// If the item is "Fût", they sell the whole keg?
			// User context: "Chargement d'un fût". "Le volume restant".
			// So they track the Fût stock. But sell glasses.
			// If they sell glasses, the item in transaction links to... ?
			// Usually we have separate items "Pinte" linked to same content.
			// For now, simple aggregation: nb * capacity.
		}
	}

	return Array.from(stats.values()).sort((a, b) => b.total_prix - a.total_prix);
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
	// Check if any perm is already open (is_active = 1)
	const activePerm = getActivePerm();
	if (activePerm && activePerm.id !== permId) {
		throw new Error("Une autre permanence est déjà ouverte. Veuillez la fermer avant d'en ouvrir une nouvelle.");
	}

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

// ========== CARTE PERM ==========

export function getPermCarte(idNomPerm: number) {
	const items = db.prepare(`
        SELECT cp.type, cp.id_item
        FROM carte_perm cp
        WHERE cp.id_nom_perm = ?
    `).all(idNomPerm) as { type: 'B' | 'C', id_item: number }[];

	// Enrichir avec les détails
	// Note: ce n'est pas le plus performant (N+1 queries) mais simple à implémenter pour SQLite
	// et le nombre d'items sur une carte est faible (< 50).
	return items.map(item => {
		if (item.type === 'B') {
			return { ...item, detail: getBoissonById(item.id_item) };
		} else {
			return { ...item, detail: getConsommableById(item.id_item) };
		}
	});
}

export function addItemToPermCarte(idNomPerm: number, type: 'B' | 'C', idItem: number) {
	return db.prepare('INSERT OR IGNORE INTO carte_perm (id_nom_perm, type, id_item) VALUES (?, ?, ?)').run(idNomPerm, type, idItem);
}

export function removeItemFromPermCarte(idNomPerm: number, type: 'B' | 'C', idItem: number) {
	return db.prepare('DELETE FROM carte_perm WHERE id_nom_perm = ? AND type = ? AND id_item = ?').run(idNomPerm, type, idItem);
}

export function getPermCarteIds(idNomPerm: number) {
	return db.prepare('SELECT type, id_item FROM carte_perm WHERE id_nom_perm = ?').all(idNomPerm) as { type: 'B' | 'C', id_item: number }[];
}

export function getMonthlyStats() {
    // Group by month (YYYY-MM)
    // We need to join with boissons/consommables to get purchase price for profit
    return db.prepare(`
        SELECT 
            strftime('%Y-%m', datetime(t.date, 'unixepoch')) as month,
            SUM(ABS(t.prix)) as total_global,
            SUM(CASE WHEN t.id_perm IS NOT NULL THEN ABS(t.prix) ELSE 0 END) as total_in_perm,
            SUM(CASE WHEN t.id_perm IS NULL THEN ABS(t.prix) ELSE 0 END) as total_out_perm,
            -- Profit calculation
            SUM(ABS(t.prix) - (t.nb * COALESCE(b.prix_achat, con.prix_achat, 0))) as total_profit
        FROM transactions t
        LEFT JOIN boissons b ON t.type = 'B' AND t.id_item = b.id
        LEFT JOIN consommables con ON t.type = 'C' AND t.id_item = con.id
        WHERE t.type IN ('B', 'C')
        GROUP BY month
        ORDER BY month DESC
    `).all();
}
