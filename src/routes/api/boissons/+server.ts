import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, requireCercleux } from '$lib/auth';
import { getAllBoissons, createBoisson } from '$lib/db/queries';

export const GET: RequestHandler = (event) => {
	requireAuth(event);
	const boissons = getAllBoissons();
	return json(boissons);
};

interface CreateBoissonDTO {
	id_contenu: number;
	id_contenant: number;
	prix_achat: number;
	consigne?: number;
	prix_vente: number;
}

export const POST: RequestHandler = async (event) => {
	requireCercleux(event);
	const data = (await event.request.json()) as CreateBoissonDTO;
	// Assuming data contains: id_contenu, id_contenant, prix_achat, consigne, prix_vente
	const { id_contenu, id_contenant, prix_achat, consigne, prix_vente } = data;

	if (!id_contenu || !id_contenant || prix_achat === undefined || prix_vente === undefined) {
		return json({ error: 'Missing fields' }, { status: 400 });
	}

	createBoisson({
		id_contenu, id_contenant, prix_achat, consigne: consigne || 0, prix_vente,
		nb_plein: 0, nb_vide: 0, nb_commande: 0
	});
	return json({ success: true });
};
