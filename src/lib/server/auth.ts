import { error } from '@sveltejs/kit';

export function requireScope(userRole: string | undefined, requiredRole: string) {
	if (!userRole) {
		throw error(401, 'Unauthorized');
	}

	// Hierarchy: user < editor < admin
	const roles = ['user', 'editor', 'admin'];
	const userRoleIndex = roles.indexOf(userRole);
	const requiredRoleIndex = roles.indexOf(requiredRole);

	if (userRoleIndex === -1 || userRoleIndex < requiredRoleIndex) {
		throw error(403, 'Forbidden: Insufficient permissions');
	}
}
