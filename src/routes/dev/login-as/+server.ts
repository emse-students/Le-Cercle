import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByLogin } from '$lib/db/queries';

export const GET: RequestHandler = ({ url, cookies }) => {
	// Seulement en mode développement
	if (process.env.NODE_ENV === 'production') {
		throw redirect(302, '/');
	}

	const userLogin = url.searchParams.get('u');
	if (!userLogin) {
		throw redirect(302, '/');
	}

	const user = getUserByLogin(userLogin);
	if (!user) {
		throw redirect(302, '/');
	}

	// Stocker l'utilisateur en session
	cookies.set('dev_user_id', user.id.toString(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 // 24h
	});

	// Rediriger vers l'accueil
	throw redirect(302, '/');
};
