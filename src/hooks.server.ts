import type { Handle } from '@sveltejs/kit';
import { getUser } from '$lib/session';
import { verifySigned } from '$lib/auth/cookies';

export const handle: Handle = async ({ event, resolve }) => {
	const user = getUser(event.cookies);
	event.locals.user = user ?? null;

	return resolve(event);
};
