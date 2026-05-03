import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/session';

export const POST: RequestHandler = ({ cookies }) => {
	console.debug('[LOGOUT] Logout requested');

    try {
        clearSessionCookie(cookies);
        console.debug('[LOGOUT] ✓ Session cleared');
    } catch (e) {
        console.error('[LOGOUT] Error clearing session:', e);
        throw error(500, 'Logout failed');
    }

    throw redirect(302, '/');
};