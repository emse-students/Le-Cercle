import type { DBUser } from '$lib/db/types';
import { db } from '$lib/db/database';

export const getUserByUUID = (uuid: string): DBUser | null => {
    const query = db.query(`SELECT * FROM users WHERE uuid = $uuid`);
    return query.get({ $uuid: uuid }) as DBUser | null;
};

export const createUser = (user: DBUser): void => {
    const query = db.query(`
        INSERT INTO users (uuid, prenom, nom, promo, solde, role, statut_cotisation)
        VALUES ($uuid, $prenom, $nom, $promo, $solde, $role, $statut_cotisation)
    `);

    query.run({
        $uuid: user.uuid,
        $prenom: user.prenom,
        $nom: user.nom,
        $promo: user.promo,
        $solde: user.solde,
        $role: user.role,
        $statut_cotisation: user.statut_cotisation
    });
};

export const updateUser = (
    uuid: string, 
    data: Partial<Omit<DBUser, 'uuid' | 'created_at'>>
): void => {
    const entries = Object.entries(data);
    if (entries.length === 0) return;

    // Construction de la clause SET (ex: "prenom = $prenom, solde = $solde")
    const setClause = entries.map(([key]) => `${key} = $${key}`).join(', ');
    
    const query = db.query(`UPDATE users SET ${setClause} WHERE uuid = $uuid`);

    // Préparation des paramètres pour l'exécution
    const params = entries.reduce((acc, [key, value]) => {
        acc[`$${key}`] = value;
        return acc;
    }, { $uuid: uuid } as Record<string, any>);

    query.run(params);
};