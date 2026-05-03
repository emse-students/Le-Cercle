import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getMatchsEnCours,
	getHistoriqueMatchs,
	getQueue,
	getEquipesParUser,
	rejoindreQueue,
	quitterQueue,
	terminerMatch,
	annulerMatch,
	equipeEstEnQueue,
	equipeEstEnMatch
} from '$lib/db/matchs';
import type { SessionUser } from '$lib/auth';

export const load: PageServerLoad = async ({ locals }) => {
	const user: SessionUser = locals.user;

	const mesEquipes = user
		? getEquipesParUser(user.id).map((e) => ({
				...e,
				enQueue: equipeEstEnQueue(e.id),
				enMatch: equipeEstEnMatch(e.id)
		  }))
		: [];

	return {
		matchsEnCours: getMatchsEnCours(),
		queue: getQueue(),
		historique: getHistoriqueMatchs(10),
		mesEquipes
	};
};

export const actions: Actions = {
	rejoindreQueue: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Non connecté' });

		const data = await request.formData();
		const id_equipe = Number(data.get('id_equipe'));
		if (!id_equipe) return fail(400, { error: 'Équipe manquante' });

		try {
			const result = rejoindreQueue(id_equipe);
			return { success: true, result };
		} catch (e: any) {
			return fail(400, { error: e.message });
		}
	},

	quitterQueue: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Non connecté' });

		const data = await request.formData();
		const id_equipe = Number(data.get('id_equipe'));
		if (!id_equipe) return fail(400, { error: 'Équipe manquante' });

		try {
			quitterQueue(id_equipe);
			return { success: true };
		} catch (e: any) {
			return fail(400, { error: e.message });
		}
	},

	terminerMatch: async ({ request, locals }) => {
		const user = locals.user;
		if (!user || user.role !== 'cercleux') return fail(403, { error: 'Non autorisé' });

		const data = await request.formData();
		const id_match = Number(data.get('id_match'));
		const id_equipe_gagnante = Number(data.get('id_equipe_gagnante'));
		if (!id_match || !id_equipe_gagnante) return fail(400, { error: 'Paramètres manquants' });

		try {
			terminerMatch(id_match, id_equipe_gagnante);
			return { success: true };
		} catch (e: any) {
			return fail(400, { error: e.message });
		}
	},

	annulerMatch: async ({ request, locals }) => {
		const user = locals.user;
		if (!user || user.role !== 'cercleux') return fail(403, { error: 'Non autorisé' });

		const data = await request.formData();
		const id_match = Number(data.get('id_match'));
		if (!id_match) return fail(400, { error: 'Match manquant' });

		try {
			annulerMatch(id_match);
			return { success: true };
		} catch (e: any) {
			return fail(400, { error: e.message });
		}
	}
};
