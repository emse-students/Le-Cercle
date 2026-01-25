import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import {
	getAllBoissons, createBoisson, updateBoisson, deleteBoisson,
	getAllConsommables, createConsommable, updateConsommable, deleteConsommable
} from '$lib/db/queries';

// GET /api/items?type=boisson|consommable
export const GET: RequestHandler = async (event) => {
	requireCercleux(event);
	const type = event.url.searchParams.get('type') || 'boisson';

	try {
		if (type === 'boisson') {
			return json(getAllBoissons());
		} else {
			return json(getAllConsommables());
		}
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};

// POST /api/items
export const POST: RequestHandler = async (event) => {
	requireCercleux(event);
	const data = await event.request.json();
	const { type, ...item } = data; // type = 'boisson' or 'consommable'

	try {
		if (type === 'boisson') {
			createBoisson(item);
		} else {
			createConsommable(item);
		}
		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};

// PUT /api/items
export const PUT: RequestHandler = async (event) => {
	requireCercleux(event);
	const data = await event.request.json();
	const { id, type, ...item } = data;

	try {
		if (type === 'boisson') {
			updateBoisson(id, item);
		} else {
			updateConsommable(id, item);
		}
		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};

// DELETE /api/items?id=123&type=boisson
export const DELETE: RequestHandler = async (event) => {
	requireCercleux(event);
	const id = Number(event.url.searchParams.get('id'));
	const type = event.url.searchParams.get('type');

	if (!id || !type) {
		return json({ error: 'Missing id or type' }, { status: 400 });
	}

	try {
		if (type === 'boisson') {
			deleteBoisson(id);
		} else {
			deleteConsommable(id);
		}
		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};
