import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { handle as authHandle } from '$lib/auth';
import { getUserById, getUserByLogin } from '$lib/db/queries';

const protectHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.getSession();
	event.locals.user = null;

	if (session?.user?.id) {
		const login = session.user.id;
		const user = getUserByLogin(login);
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
		}
	}

	if (!event.locals.user) {
		const devUserId = event.cookies.get('dev_user_id');
		const devUserLogin = event.cookies.get('dev_user_login');

		if (devUserId) {
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
					statut_cotisation: user.statut_cotisation as any,
					solde: user.solde,
					photo_url: null
				};
			}
		} else if (devUserLogin) {
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
					statut_cotisation: user.statut_cotisation as any,
					solde: user.solde,
					photo_url: null
				};
			}
		}
	}

	return resolve(event);
};

export const handle = sequence(authHandle, protectHandle);
