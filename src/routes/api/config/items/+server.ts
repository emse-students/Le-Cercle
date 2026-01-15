import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCercleux } from '$lib/auth';
import { getAllContenus, getAllContenants } from '$lib/db/queries';

export const GET: RequestHandler = (event) => {
    requireCercleux(event);
    
    return json({
        contenus: getAllContenus(),
        contenants: getAllContenants()
    });
};
