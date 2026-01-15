import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import { getBoissonById, updateBoisson } from '$lib/db/queries';
import db from '$lib/db';

// GET /api/boissons/[id]
export const GET: RequestHandler = (event) => {
	requireCercleux(event);
	const id = parseInt(event.params.id);

	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	const boisson = getBoissonById(id);
	if (!boisson) {
		return json({ error: 'Boisson not found' }, { status: 404 });
	}

	return json(boisson);
};

// PATCH /api/boissons/[id]
// PATCH /api/boissons/[id]
export const PATCH: RequestHandler = async (event) => {
	requireCercleux(event);
	const id = parseInt(event.params.id);

	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data = (await event.request.json()) as any;
		const { prix_vente, nb_plein, nb_vide, volume_restant, icone, description, nom, dose_ml } = data;

		// Mettre à jour la boisson
		updateBoisson(id, {
			prix_vente,
			nb_plein,
			nb_vide,
			volume_restant,
			icone,
			description
		});

		// Mettre à jour le nom du contenu si fourni
		if (nom !== undefined) {
			const boisson = getBoissonById(id);
			if (boisson?.id_contenu) {
				db.prepare('UPDATE contenus SET nom = ? WHERE id = ?').run(nom, boisson.id_contenu);
			}
		}

		// Mettre à jour la dose (capacité du contenant)
		if (dose_ml !== undefined && dose_ml !== null) {
			const boisson = getBoissonById(id);
			if (boisson?.id_contenant) {
				db.prepare('UPDATE contenants SET capacite_ml = ? WHERE id = ?').run(dose_ml, boisson.id_contenant);
			}
		}

		const updatedBoisson = getBoissonById(id);
		return json({ success: true, boisson: updatedBoisson });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

// DELETE /api/boissons/[id]
export const DELETE: RequestHandler = (event) => {
	requireCercleux(event);
	const id = parseInt(event.params.id);

	if (isNaN(id)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		db.prepare('DELETE FROM boissons WHERE id = ?').run(id);
		return json({ success: true });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
