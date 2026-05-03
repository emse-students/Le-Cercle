import { db } from '$lib/db/database';
import type {DBEquipe, DBMatch, DBMatchmakingQueue} from '$lib/db/types';

export function getUserTeam(uuid: number): DBEquipe {
    const query = db.query(`
        SELECT * FROM equipes WHERE (uuid_joueur1 = ? OR uuid_joueur2 = ?)
    `);

    return query.get(uuid, uuid) as DBEquipe;
}

export function isInMatchmaking(id_equipe: number): boolean {
    const query = db.query(`
        SELECT 1 FROM matchmaking_queue WHERE id_equipe = $id_equipe AND statut = 'en_attente' 
    `);

    return !!query.get({$id_equipe: id_equipe});
}

export function isInMatch(id_equipe: number): boolean {
    const query = db.query(`
        SELECT 1 FROM matchs WHERE (id_equipe1 = $id_equipe OR id_equipe2 = $id_equipe) AND statut = 'en_cours' 
    `);

    return !!query.get({$id_equipe: id_equipe});
}

export function joinMatchmaking(id_equipe: number): void {
    // 1. Vérifier si l'équipe est déjà en file ou en match actif
    if (isInMatchmaking(id_equipe) || isInMatch(id_equipe)) {
        throw new Error("L'équipe est déjà occupée (en file ou en match).");
    }
    
    // 2. Suppression des précédents matchmakings
    db.query(`
        DELETE FROM matchmaking_queue WHERE id_equipe = $id_equipe
    `).run({$id_equipe: id_equipe});

    // 3. Insertion en file
    db.query(`
        INSERT INTO matchmaking_queue (id_equipe, date_inscription, statut)
        VALUES ($id_equipe, $date, 'en_attente')
    `).run({
        $id_equipe: id_equipe,
        $date: Date.now()
    });
}

/**
 * Retire une équipe de la file d'attente (Annulation)
 */
export function leaveMatchmaking(id_equipe: number): void {
    db.query(`
        UPDATE matchmaking_queue 
        SET statut = 'annule' 
        WHERE id_equipe = $id_equipe AND statut = 'en_attente'
    `).run({$id_equipe: id_equipe});
}

export function getMatch(id_equipe: number): DBMatch | null {
    return db.query(`
        SELECT * FROM matchs 
        WHERE (id_equipe1 = ? OR id_equipe2 = ?) AND statut = 'en_cours'
        LIMIT 1
    `).get(id_equipe, id_equipe) as DBMatch | null;
}

/**
 * Tente de créer un match entre les deux équipes les plus anciennes en file
 * Utilise une transaction pour garantir l'atomicité
 */
export function tryStartMatch(id_perm: number | null = null): number | null {
    const transaction = db.transaction(() => {
        // 1. Récupérer les deux plus anciennes équipes en attente
        const candidates = db.prepare(`
            SELECT id_equipe FROM matchmaking_queue 
            WHERE statut = 'en_attente' 
            ORDER BY date_inscription ASC 
            LIMIT 2
        `).all() as { id_equipe: number }[];

        if (candidates.length < 2) return null;

        const id1 = candidates[0].id_equipe;
        const id2 = candidates[1].id_equipe;

        // 2. Marquer comme "en_match" dans la queue
        db.prepare(`UPDATE matchmaking_queue SET statut = 'en_match' WHERE id_equipe IN (?, ?)`).run(id1, id2);

        // 3. Créer le match
        const result = db.prepare(`
            INSERT INTO matchs (id_equipe1, id_equipe2, id_perm, date_debut, statut)
            VALUES (?, ?, ?, ?, 'en_cours')
            RETURNING id
        `).get(id1, id2, id_perm, Date.now()) as { id: number };

        return result.id;
    });

    return transaction();
}

/**
 * Termine un match et désigne un vainqueur
 */
export function endMatch(id_match: number, id_vainqueur: number): void {
    const match = db.prepare(`SELECT id_equipe1, id_equipe2 FROM matchs WHERE id = ?`).get(id_match) as any;

    if (!match) throw new Error("Match introuvable.");
    if (id_vainqueur !== match.id_equipe1 && id_vainqueur !== match.id_equipe2) {
        throw new Error("Le vainqueur doit faire partie des équipes du match.");
    }

    const transaction = db.transaction(() => {
        // 1. Mettre à jour le match
        db.prepare(`
            UPDATE matchs 
            SET id_equipe_gagnante = ?, statut = 'termine', date_fin = ? 
            WHERE id = ?
        `).run(id_vainqueur, Date.now(), id_match);

        // 2. Nettoyer la matchmaking_queue pour ces équipes (suppression ou archivage)
        db.prepare(`
            DELETE FROM matchmaking_queue 
            WHERE id_equipe IN (?, ?)
        `).run(match.id_equipe1, match.id_equipe2);
    });

    transaction();
}