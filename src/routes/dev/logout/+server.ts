import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies }) => {
	// Supprimer le cookie dev
	cookies.delete('dev_user_id', { path: '/' });

	// Rediriger vers l'accueil
	throw redirect(302, '/');
};
