import type { Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/session';
import { verifySigned } from '$lib/auth/cookies';

export const handle: Handle = async ({ event, resolve }) => {
	const user = getSessionUser(event.cookies);
	event.locals.user = user ?? null;

	return resolve(event);
};
