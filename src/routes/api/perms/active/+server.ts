import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireServeur } from '$lib/auth';
import { getActivePermForUser } from '$lib/db/queries';

export const GET: RequestHandler = (event) => {
	const user = requireServeur(event);

	try {
		const activePerm = getActivePermForUser(user.id);
		return json(activePerm || null);
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
