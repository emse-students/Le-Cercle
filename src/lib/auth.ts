// Authentication utilities and middleware
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export type UserRole = 'user' | 'cercleux';

export interface AuthUser {
    id: number;
    login: string;
    firstname: string;
    lastname: string;
    role: UserRole;
    solde: number;
}

/**
 * Get current user from session/locals
 * TODO: Replace with real CAS authentication
 */
export function getCurrentUser(event: RequestEvent): AuthUser | null {
	return event.locals.user || null;
}

/**
 * Require authenticated user
 */
export function requireAuth(event: RequestEvent): AuthUser {
	const user = getCurrentUser(event);
	if (!user) {
		throw error(401, 'Non authentifié');
	}
	return user;
}

/**
 * Require cercleux role (admin)
 */
export function requireCercleux(event: RequestEvent): AuthUser {
	const user = requireAuth(event);
	if (user.role !== 'cercleux') {
		throw error(403, 'Accès réservé aux administrateurs');
	}
	return user;
}

/**
 * Require serveur role (at least) or valid barman
 */
export function requireServeur(event: RequestEvent): AuthUser {
	const user = requireAuth(event);
	// On autorise tout utilisateur authentifié à passer cette barrière initiale.
	// Les routes spécifiques DOIVENT vérifier si l'utilisateur est barman de la perm active
	// ou est 'cercleux'.
	// checkServeurPermAccess(userId, permId) doit être appelé plus tard.
	return user;
}

/**
 * Check if user is assigned to a perm and perm is open
 */
export async function checkServeurPermAccess(userId: number, permId: number): Promise<boolean> {
	const { isUserInPerm, isPermOpen } = await import('$lib/db/queries');

	const [inPerm, permOpen] = await Promise.all([
		isUserInPerm(userId, permId),
		isPermOpen(permId)
	]);

	return inPerm && permOpen;
}
