import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import { searchUsers, createUser, updateUserRole, updateUserSolde, getAllUsers } from '$lib/db/queries';

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
}

// POST /api/users - Create user
export const POST: RequestHandler = async (event) => {
	requireCercleux(event);

	const data = (await event.request.json()) as CreateUserDTO;
	const { login, prenom, nom, promo, solde = 0, role = 'user' } = data;

	// Génération automatique du mail si non fourni
	const mail = data.mail || `${login}@etu.emse.fr`;

	if (!login || !prenom || !nom || !promo) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		const result = createUser({ login, mail, prenom, nom, promo: Number(promo), solde, role });
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

// PATCH /api/users - Update user
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
