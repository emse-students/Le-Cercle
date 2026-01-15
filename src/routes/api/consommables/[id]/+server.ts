import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import { getConsommableById, updateConsommable } from '$lib/db/queries';
import db from '$lib/db';

// GET /api/consommables/[id]
export const GET: RequestHandler = (event) => {
	requireCercleux(event);
	const id = parseInt(event.params.id);

	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	const consommable = getConsommableById(id);
	if (!consommable) {
		return json({ error: 'Consommable not found' }, { status: 404 });
	}

	return json(consommable);
};

// PATCH /api/consommables/[id]
export const PATCH: RequestHandler = async (event) => {
	requireCercleux(event);
	const id = parseInt(event.params.id);

	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		const data = (await event.request.json()) as any;
		const { prix_vente, prix_achat, stock, icone, description, nom } = data;

		// Validation simple
		if (
			(prix_vente !== undefined && prix_vente < 0) ||
			(prix_achat !== undefined && prix_achat < 0) ||
			(stock !== undefined && stock < 0)
		) {
			return json({ error: 'Invalid values' }, { status: 400 });
		}

		updateConsommable(id, {
			prix_vente,
			prix_achat,
			stock,
			icone,
			description,
			nom
		});

		const updatedConsommable = getConsommableById(id);
		return json({ success: true, consommable: updatedConsommable });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

// DELETE /api/consommables/[id]
export const DELETE: RequestHandler = (event) => {
	requireCercleux(event);
	const id = parseInt(event.params.id);

	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		db.prepare('DELETE FROM consommables WHERE id = ?').run(id);
		return json({ success: true });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
