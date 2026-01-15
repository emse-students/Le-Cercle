import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import db from '$lib/db';
import { getPermById, getPermMembers } from '$lib/db/queries';

// GET /api/perms/[id] - Get perm details with barmans
export const GET: RequestHandler = ({ params }) => {
	const permId = parseInt(params.id);

	const perm = getPermById(permId);
	if (!perm) {
		return json({ error: 'Perm not found' }, { status: 404 });
	}

	const barmans = getPermMembers(permId);

	return json({ ...perm, barmans });
};

// PUT /api/perms/[id] - Update perm
export const PUT: RequestHandler = async (event) => {
	requireCercleux(event);
	const id = Number(event.params.id);
	const data = await event.request.json();
	const { nom, date, barmen } = data; // barmen array of IDs

	if (!nom || !date) {
		return json({ error: 'Missing nom or date' }, { status: 400 });
	}

	try {
		db.transaction(() => {
			// Update nom_perm
			const perm = db.prepare('SELECT id_nom_perm FROM perms WHERE id = ?').get(id) as any;
			if (perm) {
				db.prepare('UPDATE noms_perms SET nom = ? WHERE id = ?').run(nom, perm.id_nom_perm);
			}

			// Update perm date
			db.prepare('UPDATE perms SET date = ? WHERE id = ?').run(date, id);

			// Update barmen (Delete all and re-insert)
			if (barmen) {
				db.prepare('DELETE FROM perm_barmans WHERE id_perm = ?').run(id);
				const insert = db.prepare('INSERT INTO perm_barmans (id_perm, id_user) VALUES (?, ?)');
				for (const uid of barmen) {
					insert.run(id, uid);
				}
			}
		})();

		return json({ success: true });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
};
