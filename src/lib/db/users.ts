import { db } from '$lib/db/database';

export interface DBUser {
	id_user: string;
	name: string;
	first_name?: string | null;
	last_name?: string | null;
	role: 'cercleux' | 'user';
	promo?: number | null;
}

export function getUserById(casId: string): DBUser | undefined {
	const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
	return stmt.get(casId) as DBUser | undefined;
}

export function createUser(user: DBUser) {
	const stmt = db.prepare(`
		INSERT INTO users (id, login, prenom, nom, role, promo)
		VALUES (?, ?, ?, ?, ?, ?)
	`);

	return stmt.run(
		user.id_user,
		user.name,
		user.first_name || 'invalide',
		user.last_name || 'invalide',
		user.role,
		user.promo || 0,
	);
}

export function updateUser(user: Partial<DBUser> & { id_user: string }) {
	// 1. Define exactly which keys in your object map to which columns in SQL
    // Format: [ObjectKey]: "DatabaseColumnName"
    const fieldMap: Record<string, string> = {
        name: "login",
        first_name: "prenom", // or "firstName" if that's what's in DB
        last_name: "nom",
        promo: "promo",
        role: "role"
    };

    const sets: string[] = [];
    const params: Record<string, any> = { id_user: user.id_user };

    // 2. Build the query only using fields that exist in BOTH the object and the map
    for (const [objKey, dbCol] of Object.entries(fieldMap)) {
        if (user[objKey as keyof typeof user] !== undefined) {
            sets.push(`${dbCol} = @${objKey}`);
            params[objKey] = user[objKey as keyof typeof user];
        }
    }

    if (sets.length === 0) return; // Nothing to update

    // 3. Prepare the statement with the filtered columns
    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = @id_user`;
    const stmt = db.prepare(sql);
    
    return stmt.run(params);
}