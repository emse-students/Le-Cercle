import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import { getPermTransactions } from '$lib/db/queries';

export const GET: RequestHandler = (event) => {
	requireCercleux(event);
	const id = parseInt(event.params.id);

	if (isNaN(id)) {
		return json({ error: 'Invalid perm ID' }, { status: 400 });
	}

	try {
		const transactions = getPermTransactions(id);
		return json(transactions);
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 500 });
	}
};
