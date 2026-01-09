import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rechargeBalance } from '$lib/db/queries';

interface DevRechargeDTO {
	userId: number;
	amount: number;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, amount } = (await request.json()) as DevRechargeDTO;

		if (!userId || amount === undefined) {
			return json({ error: 'Missing userId or amount' }, { status: 400 });
		}

		const newBalance = rechargeBalance(userId, Number(amount));
		return json({ success: true, newBalance });
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 500 });
	}
};
