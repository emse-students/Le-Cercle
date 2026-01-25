import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import { getMonthlyStats } from '$lib/db/queries';

export const GET: RequestHandler = async (event) => {
	// Only admins can see global stats
	requireCercleux(event);

	try {
		const stats = getMonthlyStats();
		return json(stats);
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};
