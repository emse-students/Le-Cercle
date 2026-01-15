import { type Handle } from '@sveltejs/kit';
import { getUserById, getUserByLogin } from '$lib/db/queries';

export const handle: Handle = async ({ event, resolve }) => {
	// Vérifier si on a un cookie de dev
	const devUserId = event.cookies.get('dev_user_id');
	const devUserLogin = event.cookies.get('dev_user_login');

	if (devUserId) {
		// Mode dev - récupérer l'utilisateur depuis la DB par ID
		const user = getUserById(parseInt(devUserId));
		if (user) {
			event.locals.user = {
				id: user.id,
				login: user.login,
				mail: user.mail,
				firstname: user.prenom,
				lastname: user.nom,
				promo: user.promo,
				role: user.role as 'user' | 'cercleux',
				statut_cotisation: user.statut_cotisation as
					| 'non_cotisant'
					| 'cotisant_sans_alcool'
					| 'cotisant_avec_alcool',
				solde: user.solde,
				photo_url: null
			};
		} else {
			event.locals.user = null;
		}
	} else if (devUserLogin) {
		// Mode dev - récupérer l'utilisateur par login
		const user = getUserByLogin(devUserLogin);
		if (user) {
			event.locals.user = {
				id: user.id,
				login: user.login,
				mail: user.mail,
				firstname: user.prenom,
				lastname: user.nom,
				promo: user.promo,
				role: user.role as 'user' | 'cercleux',
				statut_cotisation: user.statut_cotisation as
					| 'non_cotisant'
					| 'cotisant_sans_alcool'
					| 'cotisant_avec_alcool',
				solde: user.solde,
				photo_url: null
			};
		} else {
			event.locals.user = null;
		}
	} else {
		// Pas d'utilisateur connecté
		event.locals.user = null;
	}

	const response = await resolve(event);
	return response;
};
