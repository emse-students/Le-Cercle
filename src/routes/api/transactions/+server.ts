import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireServeur, requireAuth, checkServeurPermAccess } from '$lib/auth';
import { createTransaction, getPermTransactions, getUserTransactions } from '$lib/db/queries';

// GET /api/transactions?permId=123 OR GET /api/transactions?userId=123
export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const permId = event.url.searchParams.get('permId');
	const userId = event.url.searchParams.get('userId');

	// Historique utilisateur
	if (userId) {
		const userIdNum = parseInt(userId);

		// L'utilisateur peut voir son propre historique, ou un cercleux peut voir celui de n'importe qui
		if (user.id !== userIdNum && user.role !== 'cercleux') {
			return json({ error: 'Accès refusé' }, { status: 403 });
		}

		const transactions = getUserTransactions(userIdNum);
		return json(transactions);
	}

	// Historique de perm
	if (permId) {
		const permIdNum = parseInt(permId);

		// Vérifier que l'utilisateur peut accéder à cette perm
		const hasAccess = await checkServeurPermAccess(user.id, permIdNum);
		if (!hasAccess && user.role !== 'cercleux') {
			return json({ error: 'Accès refusé à cette perm' }, { status: 403 });
		}

		const transactions = getPermTransactions(permIdNum);
		return json(transactions);
	}

	return json({ error: 'Missing permId or userId' }, { status: 400 });
};

interface CreateTransactionDTO {
	userId: number;
	permId: number;
	type: 'A' | 'B' | 'C';
	itemId: number;
	quantity: number;
	price: number;
}

// POST /api/transactions - Create transaction (encaissement)
export const POST: RequestHandler = async (event) => {
	const serveur = requireServeur(event);
	const data = (await event.request.json()) as CreateTransactionDTO;
	const { userId, permId, type, itemId, quantity, price } = data;

	if (!userId || !permId || !type || !itemId || !quantity) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	if (!['A', 'B', 'C'].includes(type)) {
		return json({ error: 'Invalid transaction type' }, { status: 400 });
	}

	// Vérifier que le serveur peut encaisser dans cette perm
	const hasAccess = await checkServeurPermAccess(serveur.id, permId);
	if (!hasAccess && serveur.role !== 'cercleux') {
		return json({ error: 'Vous ne pouvez pas encaisser dans cette perm' }, { status: 403 });
	}

	try {
		const result = createTransaction({
			id_user: userId,
			id_debiteur: serveur.id,
			id_perm: permId,
			type,
			id_item: itemId,
			date: Math.floor(Date.now() / 1000),
			nb: quantity,
			prix: -Math.abs(price) // Négatif pour une consommation
		});

		return json({ success: true, id: Number(result.lastInsertRowid) });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
