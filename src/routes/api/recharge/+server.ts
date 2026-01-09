import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import { updateUserSolde, getUserById, createTransaction } from '$lib/db/queries';

interface RechargeDTO {
	userId: number;
	amount: number;
}

// POST /api/recharge - Recharge user account
export const POST: RequestHandler = async (event) => {
	const cercleux = requireCercleux(event);

	const data = (await event.request.json()) as RechargeDTO;
	const { userId, amount } = data;

	if (!userId || !amount || amount <= 0) {
		return json({ error: 'Invalid userId or amount' }, { status: 400 });
	}

	try {
		const user = getUserById(userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const newSolde = user.solde + amount;
		updateUserSolde(userId, newSolde);

		// Créer une transaction de type "A" (Autre/Recharge)
		// Note: permId = 0 pour les recharges (pas de perm associée)
		createTransaction({
			id_user: userId,
			id_debiteur: cercleux.id,
			id_perm: 0,
			type: 'A',
			id_item: 0,
			date: Math.floor(Date.now() / 1000),
			nb: 1,
			prix: amount // Positif pour une recharge
		});

		return json({ success: true, newSolde });
	} catch (err: unknown) {
		return json({ error: (err as Error).message }, { status: 500 });
	}
};
