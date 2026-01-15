import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import { searchUsers, createUser, updateUserRole, updateUserSolde, updateUserStatutCotisation, deleteUser, getAllUsers, getUserById } from '$lib/db/queries';
import type { User } from '$lib/types';
import db from '$lib/db';

// GET /api/users?q=search (retourne tous les users si pas de query)
export const GET: RequestHandler = (event) => {
	requireCercleux(event);

	const query = event.url.searchParams.get('q');

	if (!query) {
		const users = getAllUsers();
		return json(users);
	}

	const users = searchUsers(query);
	return json(users);
};

interface CreateUserDTO {
	login: string;
	mail: string;
	prenom: string;
	nom: string;
	promo: number;
	solde?: number;
	role?: 'user' | 'cercleux';
	statut_cotisation?: 'non_cotisant' | 'cotisant_sans_alcool' | 'cotisant_avec_alcool';
}

// POST /api/users - Create user
export const POST: RequestHandler = async (event) => {
	requireCercleux(event);

	const data = (await event.request.json()) as CreateUserDTO;
	const { login, prenom, nom, promo, solde = 0, role = 'user', statut_cotisation = 'non_cotisant' } = data;

	// Génération automatique du mail si non fourni
	const mail = data.mail || `${login}@etu.emse.fr`;

	if (!login || !prenom || !nom || !promo) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		const result = createUser({ login, mail, prenom, nom, promo: Number(promo), solde, role, statut_cotisation });
		return json({ success: true, id: Number(result.lastInsertRowid) });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

interface UpdateUserDTO {
	id: number;
	role?: string;
	solde?: number;
}

// PATCH /api/users - Update user role or statut
export const PATCH: RequestHandler = async (event) => {
	requireCercleux(event);

	const data = (await event.request.json()) as UpdateUserDTO;
	const { id, role, solde } = data;

	if (!id) {
		return json({ error: 'Missing user ID' }, { status: 400 });
	}

	try {
		if (role !== undefined) {
			updateUserRole(id, role);
		}
		if (solde !== undefined) {
			updateUserSolde(id, solde);
		}
		return json({ success: true });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

// PUT /api/users - Update full user
export const PUT: RequestHandler = async (event) => {
	requireCercleux(event);

	const data = (await event.request.json()) as Partial<User>;

	if (!data.id) {
		return json({ error: 'Missing user ID' }, { status: 400 });
	}

	try {
		// Mise à jour des différents champs
		if (data.login !== undefined || data.mail !== undefined || data.prenom !== undefined || data.nom !== undefined || data.promo !== undefined) {
			const user = getUserById(data.id);
			if (!user) {
				return json({ error: 'User not found' }, { status: 404 });
			}

			const stmt = db.prepare(`
				UPDATE users 
				SET login = ?, mail = ?, prenom = ?, nom = ?, promo = ?
				WHERE id = ?
			`);
			stmt.run(
				data.login ?? user.login,
				data.mail ?? user.mail,
				data.prenom ?? user.prenom,
				data.nom ?? user.nom,
				data.promo ?? user.promo,
				data.id
			);
		}

		if (data.role !== undefined) {
			updateUserRole(data.id, data.role);
		}
		if (data.statut_cotisation !== undefined) {
			updateUserStatutCotisation(data.id, data.statut_cotisation);
		}
		if (data.solde !== undefined) {
			updateUserSolde(data.id, data.solde);
		}

		return json({ success: true });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

// DELETE /api/users?id=123
export const DELETE: RequestHandler = async (event) => {
	requireCercleux(event);

	const userId = event.url.searchParams.get('id');

	if (!userId) {
		return json({ error: 'Missing user ID' }, { status: 400 });
	}

	try {
		deleteUser(Number(userId));
		return json({ success: true });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
