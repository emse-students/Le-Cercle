import { type Handle } from '@sveltejs/kit';
import type { AuthUser } from '$lib/auth';
import { getUserById } from '$lib/db/queries';

export const handle: Handle = async ({ event, resolve }) => {
	// Vérifier si on a un cookie de dev
	const devUserId = event.cookies.get('dev_user_id');

	if (devUserId) {
		// Mode dev - récupérer l'utilisateur depuis la DB
		const user = getUserById(parseInt(devUserId));
		if (user) {
			event.locals.user = {
				id: user.id,
				login: user.login,
				firstname: user.prenom,
				lastname: user.nom,
				role: user.role as 'user' | 'cercleux',
				solde: user.solde
			};
		} else {
			event.locals.user = null;
		}
	} else {
		// Placeholder for Auth implementation
		// TODO: Replace with real CAS authentication

		// Mock admin user for testing
		const mockUser: AuthUser = {
			id: 1,
			login: 'admin',
			firstname: 'Admin',
			lastname: 'Cercleux',
			role: 'cercleux',
			solde: 0
		};

		event.locals.user = mockUser;
	}

	const response = await resolve(event);
	return response;
};
