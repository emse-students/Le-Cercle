import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { getUserByUUID } from '$lib/db/user';
import type { DBUser } from '$lib/db/types';

const SESSION_COOKIE_NAME = '__session_user';
const MAX_AGE = 365 * 24 * 60 * 60; // 1 year

/**
 * Set session cookie after successful login
 */
export function setSessionCookie(cookies: Cookies, userId: string): void {
	cookies.set(SESSION_COOKIE_NAME, userId, {
		path: '/',
		maxAge: MAX_AGE,
		sameSite: 'lax',
		secure: !dev,
		httpOnly: true
	});
}

/**
 * Clear session cookie on logout
 */
export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Get current session user from cookie
 */
export function getUser(cookies: Cookies): DBUser | null {
	const userId = cookies.get(SESSION_COOKIE_NAME);

	if (!userId) {
		return null;
	}
	
	try {
		const dbUser = getUserByUUID(userId);
		return dbUser;
	} catch (e) {
		console.error('[SESSION] Error retrieving user:', e);
		return null;
	}
}