import { db } from '$lib/db/database';
import type { DBUser } from '$lib/db/types';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getUserTeam, joinMatchmaking, leaveMatchmaking, tryStartMatch, endMatch, getMatch, isInMatchmaking } from '$lib/db/matchs';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		fail(500);
	}

	const equipe = getUserTeam(locals.user.uuid);
	if (!equipe) {
		throw fail(500, {error: "Tu n'as pas d'équipe"});
	}

	const match = getMatch(equipe.id);
	if (!match) {
		return {
			equipe: equipe,
			match: null,
			matchmaking: isInMatchmaking(equipe.id),
		}
	}
	
	const query = db.query(`
		SELECT
			t1.nom AS nom_equipe1,
			t2.nom AS nom_equipe2,
			t1_p1.prenom AS prenom_t1_p1,
			t1_p2.prenom AS prenom_t1_p2,
			t2_p1.prenom AS prenom_t2_p1,
			t2_p2.prenom AS prenom_t2_p2
		FROM matchs m
		JOIN equipes t1 ON m.id_equipe1 = t1.id
		JOIN equipes t2 ON m.id_equipe2 = t2.id
		JOIN users t1_p1 ON t1.uuid_joueur1 = t1_p1.uuid
		JOIN users t1_p2 ON t1.uuid_joueur2 = t1_p2.uuid
		JOIN users t2_p1 ON t2.uuid_joueur1 = t2_p1.uuid
		JOIN users t2_p2 ON t2.uuid_joueur2 = t2_p2.uuid
		WHERE m.id = $match_id
	`);

	const noms = query.get({ $match_id: match.id });
	
	const query2 = db.query(`
		SELECT
			t1.nom AS nom_equipe1,
			t2.nom AS nom_equipe2,
			CASE
				WHEN m.id_equipe_gagnante = $mon_equipe THEN TRUE 
				ELSE FALSE
			END AS victoire
		FROM matchs m
		JOIN equipes t1 ON m.id_equipe1 = t1.id
		JOIN equipes t2 ON m.id_equipe2 = t2.id
		WHERE (m.id_equipe1 = $mon_equipe OR m.id_equipe2 = $mon_equipe)
	`);

	return {
		equipe: equipe,
		match: match,
		noms: noms,
		historique: query2.all({$mon_equipe: equipe.id}),
		matchmaking: isInMatchmaking(equipe.id),
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
			const result = joinMatchmaking(id_equipe);
			
			tryStartMatch();

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
			leaveMatchmaking(id_equipe);
			return { success: true };
		} catch (e: any) {
			return fail(400, { error: e.message });
		}
	},

	terminerMatch: async ({ request, locals }) => {
		const user = locals.user;

		const data = await request.formData();
		const id_match = Number(data.get('id_match'));
		const id_equipe_gagnante = Number(data.get('id_equipe_gagnante'));
		if (!id_match || !id_equipe_gagnante) return fail(400, { error: 'Paramètres manquants' });

		try {
			endMatch(id_match, id_equipe_gagnante);
			return { success: true };
		} catch (e: any) {
			return fail(400, { error: e.message });
		}
	},

	annulerMatch: async ({ request, locals }) => {
		const user = locals.user;

		const data = await request.formData();
		const id_match = Number(data.get('id_match'));
		if (!id_match) return fail(400, { error: 'Match manquant' });

		try {
			endMatch(id_match, 0);
			return { success: true };
		} catch (e: any) {
			return fail(400, { error: e.message });
		}
	}
};
