import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import db from '$lib/db';
import {
	deletePerm,
	openPerm,
	closePerm,
	assignUserToPerm,
	removeUserFromPerm,
	getAllPerms
} from '$lib/db/queries';

// GET /api/perms
export const GET: RequestHandler = (event) => {
	requireCercleux(event);

	const perms = getAllPerms();
	return json(perms);
};

interface CreatePermDTO {
	nom: string;
	date: number; // Unix timestamp
	barmen: number[]; // Array of user IDs
}

// POST /api/perms - Create perm
export const POST: RequestHandler = async (event) => {
	requireCercleux(event);

	const data = (await event.request.json()) as CreatePermDTO;
	const { nom, date, barmen } = data;

	if (!nom || !date) {
		return json({ error: 'Missing nom or date' }, { status: 400 });
	}

	try {
		const result = db.transaction(() => {
			const currentYear = new Date().getFullYear().toString(); // Use current year for noms_perms.annee

			const nomPermStmt = db.prepare('INSERT INTO noms_perms (nom, annee, is_active) VALUES (?, ?, 0)');
			const nomPermResult = nomPermStmt.run(nom, currentYear);
			const nomPermId = Number(nomPermResult.lastInsertRowid);

			const permStmt = db.prepare('INSERT INTO perms (id_nom_perm, date, total_vente, total_litre) VALUES (?, ?, 0, 0)');
			const permResult = permStmt.run(nomPermId, date);
			const permId = Number(permResult.lastInsertRowid);

			// Add Barmen
			if (barmen && barmen.length > 0) {
				const barmanStmt = db.prepare('INSERT INTO perm_barmans (id_perm, id_user) VALUES (?, ?)');
				for (const userId of barmen) {
					barmanStmt.run(permId, userId);
				}
			}

			return { permId, nomPermId };
		})();

		return json({ success: true, ...result });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

// DELETE /api/perms?id=123
export const DELETE: RequestHandler = (event) => {
	requireCercleux(event);

	const permId = event.url.searchParams.get('id');
	if (!permId) {
		return json({ error: 'Missing perm ID' }, { status: 400 });
	}

	try {
		deletePerm(parseInt(permId));
		return json({ success: true });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};

interface PermActionDTO {
	permId: number;
	action: 'open' | 'close' | 'assign' | 'remove';
	userId?: number;
}

// PATCH /api/perms - Open/close perm or assign/remove members
export const PATCH: RequestHandler = async (event) => {
	requireCercleux(event);

	const data = (await event.request.json()) as PermActionDTO;
	const { permId, action, userId } = data;

	if (!permId || !action) {
		return json({ error: 'Missing permId or action' }, { status: 400 });
	}

	try {
		switch (action) {
			case 'open':
				openPerm(permId);
				break;
			case 'close':
				closePerm(permId);
				break;
			case 'assign':
				if (!userId) {
					return json({ error: 'Missing userId' }, { status: 400 });
				}
				assignUserToPerm(userId, permId);
				break;
			case 'remove':
				if (!userId) {
					return json({ error: 'Missing userId' }, { status: 400 });
				}
				removeUserFromPerm(userId, permId);
				break;
			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}

		return json({ success: true });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
