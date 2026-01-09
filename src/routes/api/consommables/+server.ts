import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, requireCercleux } from '$lib/auth';
import { getAllConsommables, createConsommable } from '$lib/db/queries';

export const GET: RequestHandler = (event) => {
	requireAuth(event);
	const consommables = getAllConsommables();
	return json(consommables);
};

interface CreateConsommableDTO {
	nom: string;
	prix_vente: number;
}

export const POST: RequestHandler = async (event) => {
	requireCercleux(event);
	const data = (await event.request.json()) as CreateConsommableDTO;
	const { nom, prix_vente } = data;

	if (!nom || prix_vente === undefined) {
		return json({ error: 'Missing fields' }, { status: 400 });
	}

	createConsommable({ nom, prix_vente });
	return json({ success: true });
};
