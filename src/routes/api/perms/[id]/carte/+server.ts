
import { json, type RequestEvent } from '@sveltejs/kit';
import { requireCercleux } from '$lib/auth';
import { getPermCarte, addItemToPermCarte, removeItemFromPermCarte, getPermById } from '$lib/db/queries';

export function GET({ params }: RequestEvent) {
	const permId = parseInt(params.id || '');
	if (isNaN(permId)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	const perm = getPermById(permId);
	if (!perm) {
		return json({ error: 'Perm not found' }, { status: 404 });
	}

	const carte = getPermCarte(perm.id_nom_perm);
	return json(carte);
}

export async function POST({ params, request, locals }: RequestEvent) {
	requireCercleux({ locals } as any);

	const permId = parseInt(params.id || '');
	if (isNaN(permId)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	const perm = getPermById(permId);
	if (!perm) {
		return json({ error: 'Perm not found' }, { status: 404 });
	}

	const { type, idItem } = await request.json();
	if (!type || !idItem) {
		return json({ error: 'Missing fields' }, { status: 400 });
	}

	addItemToPermCarte(perm.id_nom_perm, type, idItem);
	return json({ success: true });
}

export function DELETE({ params, url, locals }: RequestEvent) {
	requireCercleux({ locals } as any);

	const permId = parseInt(params.id || '');
	if (isNaN(permId)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	const perm = getPermById(permId);
	if (!perm) {
		return json({ error: 'Perm not found' }, { status: 404 });
	}

	const type = url.searchParams.get('type') as 'B' | 'C';
	const idItem = parseInt(url.searchParams.get('idItem') || '');

	if (!type || isNaN(idItem)) {
		return json({ error: 'Missing fields' }, { status: 400 });
	}

	removeItemFromPermCarte(perm.id_nom_perm, type, idItem);
	return json({ success: true });
}
