import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import {
	getUserById,
	updateUserRole,
	updateUserSolde,
	updateUserStatutCotisation,
	deleteUser
} from '$lib/db/queries';

// GET /api/users/[id] - Get user by ID
export const GET: RequestHandler = (event) => {
	requireCercleux(event);

	const userId = parseInt(event.params.id);
	if (isNaN(userId)) {
		return json({ error: 'Invalid user ID' }, { status: 400 });
	}

	const user = getUserById(userId);
	if (!user) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	return json(user);
};

interface UpdateUserDTO {
	role?: 'user' | 'cercleux';
	statut_cotisation?: 'non_cotisant' | 'cotisant_sans_alcool' | 'cotisant_avec_alcool';
	solde?: number;
}

// PATCH /api/users/[id] - Update user
export const PATCH: RequestHandler = async (event) => {
	requireCercleux(event);

	const userId = parseInt(event.params.id);
	if (isNaN(userId)) {
		return json({ error: 'Invalid user ID' }, { status: 400 });
	}

	const data = (await event.request.json()) as UpdateUserDTO;

	try {
		// Update role if provided
		if (data.role !== undefined) {
			updateUserRole(userId, data.role);
		}

		// Update statut_cotisation if provided
		if (data.statut_cotisation !== undefined) {
			updateUserStatutCotisation(userId, data.statut_cotisation);
		}

		// Update solde if provided
		if (data.solde !== undefined) {
			updateUserSolde(userId, data.solde);
		}

		// Return updated user
		const updatedUser = getUserById(userId);
		return json({ success: true, user: updatedUser });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

// DELETE /api/users/[id] - Delete user
export const DELETE: RequestHandler = (event) => {
	requireCercleux(event);

	const userId = parseInt(event.params.id);
	if (isNaN(userId)) {
		return json({ error: 'Invalid user ID' }, { status: 400 });
	}

	try {
		deleteUser(userId);
		return json({ success: true });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
