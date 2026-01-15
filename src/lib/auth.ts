// Authentication utilities and middleware
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export type UserRole = 'user' | 'cercleux';
export type StatutCotisation = 'non_cotisant' | 'cotisant_sans_alcool' | 'cotisant_avec_alcool';

export interface AuthUser {
	id: number;
	login: string;
	mail: string;
	firstname: string;
	lastname: string;
	promo: number;
	role: UserRole;
	statut_cotisation: StatutCotisation;
	solde: number;
	photo_url?: string | null;
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
 * Require cotisant status (avec ou sans alcool)
 */
export function requireCotisant(event: RequestEvent): AuthUser {
	const user = requireAuth(event);
	if (
		user.statut_cotisation !== 'cotisant_avec_alcool' &&
		user.statut_cotisation !== 'cotisant_sans_alcool'
	) {
		throw error(403, 'Accès réservé aux cotisants');
	}
	return user;
}

/**
 * Check if user is cotisant
 */
export function isCotisant(user: AuthUser | null): boolean {
	if (!user) {
		return false;
	}
	return (
		user.statut_cotisation === 'cotisant_avec_alcool' ||
		user.statut_cotisation === 'cotisant_sans_alcool'
	);
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
