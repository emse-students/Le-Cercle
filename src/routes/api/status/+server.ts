import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return json({
		status: 'ok',
		service: 'Le Cercle API',
		timestamp: new Date().toISOString()
	});
};
