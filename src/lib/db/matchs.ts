import { db } from '$lib/db/database';

// ============================================
// TYPES
// ============================================

export type Equipe = {
	id: number;
	nom: string;
	created_at: string;
};

export type EquipeAvecMembres = Equipe & {
	membres: { id: string; login: string; prenom: string; nom: string }[];
};

export type Match = {
	id: number;
	id_equipe1: number;
	id_equipe2: number;
	id_equipe_gagnante: number | null;
	statut: 'en_cours' | 'termine' | 'annule';
	id_perm: number | null;
	date_debut: number;
	date_fin: number | null;
};

export type MatchComplet = Match & {
	equipe1: EquipeAvecMembres;
	equipe2: EquipeAvecMembres;
	equipe_gagnante: Equipe | null;
};

export type QueueEntry = {
	id: number;
	id_equipe: number;
	statut: 'en_attente' | 'en_match' | 'annule';
	date_inscription: number;
	equipe: EquipeAvecMembres;
};

// ============================================
// HELPERS INTERNES
// ============================================

function getEquipeAvecMembres(id: number): EquipeAvecMembres | null {
	const equipe = db
		.prepare('SELECT * FROM equipes WHERE id = ?')
		.get(id) as Equipe | null;

	if (!equipe) return null;

	const membres = db
		.prepare(
			`SELECT u.id, u.login, u.prenom, u.nom
       FROM equipe_membres em
       JOIN users u ON u.id = em.id_user
       WHERE em.id_equipe = ?`
		)
		.all(id) as EquipeAvecMembres['membres'];

	return { ...equipe, membres };
}

function enrichirMatch(match: Match): MatchComplet {
	return {
		...match,
		equipe1: getEquipeAvecMembres(match.id_equipe1)!,
		equipe2: getEquipeAvecMembres(match.id_equipe2)!,
		equipe_gagnante: match.id_equipe_gagnante
			? (db.prepare('SELECT * FROM equipes WHERE id = ?').get(match.id_equipe_gagnante) as Equipe)
			: null
	};
}

// ============================================
// ÉQUIPES
// ============================================

/** Retourne toutes les équipes avec leurs membres */
export function getAllEquipes(): EquipeAvecMembres[] {
	const equipes = db
		.prepare('SELECT * FROM equipes WHERE is_ephemere = 0 ORDER BY nom')
		.all() as Equipe[];

	return equipes.map((e) => getEquipeAvecMembres(e.id)!);
}

/** Retourne une équipe par son id */
export function getEquipe(id: number): EquipeAvecMembres | null {
	return getEquipeAvecMembres(id);
}

/** Retourne les équipes dont un user est membre */
export function getEquipesParUser(id_user: string): EquipeAvecMembres[] {
	const equipes = db
		.prepare(
			`SELECT e.* FROM equipes e
       JOIN equipe_membres em ON em.id_equipe = e.id
       WHERE em.id_user = ? AND e.is_ephemere = 0`
		)
		.all(id_user) as Equipe[];

	return equipes.map((e) => getEquipeAvecMembres(e.id)!);
}

/** Vérifie si une équipe est actuellement en match */
export function equipeEstEnMatch(id_equipe: number): boolean {
	const match = db
		.prepare(
			`SELECT id FROM matchs
       WHERE (id_equipe1 = ? OR id_equipe2 = ?) AND statut = 'en_cours'`
		)
		.get(id_equipe, id_equipe);

	return !!match;
}

/** Vérifie si une équipe est dans la queue */
export function equipeEstEnQueue(id_equipe: number): boolean {
	const entry = db
		.prepare(
			`SELECT id FROM matchmaking_queue
       WHERE id_equipe = ? AND statut = 'en_attente'`
		)
		.get(id_equipe);

	return !!entry;
}

// ============================================
// MATCHMAKING QUEUE
// ============================================

/** Retourne toutes les équipes en attente de match */
export function getQueue(): QueueEntry[] {
	const entries = db
		.prepare(
			`SELECT * FROM matchmaking_queue
       WHERE statut = 'en_attente'
       ORDER BY date_inscription ASC`
		)
		.all() as Omit<QueueEntry, 'equipe'>[];

	return entries.map((e) => ({
		...e,
		equipe: getEquipeAvecMembres(e.id_equipe)!
	}));
}

/**
 * Inscrit une équipe dans la queue, puis cherche un adversaire.
 * Si un adversaire est disponible, crée le match immédiatement.
 * Retourne le match créé, ou null si l'équipe attend toujours.
 */
export function rejoindreQueue(
	id_equipe: number,
	id_perm?: number
): { match: MatchComplet } | { en_attente: true } {
	if (equipeEstEnMatch(id_equipe)) {
		throw new Error('Cette équipe est déjà en match.');
	}
	if (equipeEstEnQueue(id_equipe)) {
		throw new Error("Cette équipe est déjà dans la file d'attente.");
	}

	const now = Math.floor(Date.now() / 1000);

	// Cherche un adversaire disponible (pas sa propre équipe, FIFO)
	const adversaire = db
		.prepare(
			`SELECT * FROM matchmaking_queue
       WHERE statut = 'en_attente' AND id_equipe != ?
       ORDER BY date_inscription ASC
       LIMIT 1`
		)
		.get(id_equipe) as Omit<QueueEntry, 'equipe'> | null;

	if (!adversaire) {
		// Personne disponible → on s'inscrit et on attend
		db.prepare(
			`INSERT INTO matchmaking_queue (id_equipe, statut, date_inscription)
       VALUES (?, 'en_attente', ?)`
		).run(id_equipe, now);

		return { en_attente: true };
	}

		// Passer les deux équipes en 'en_match'
		db.prepare(
			`UPDATE matchmaking_queue SET statut = 'en_match' WHERE id_equipe = ?`
		).run(adversaire.id_equipe);

		// Insérer notre propre entrée directement en 'en_match'
		db.prepare(
			`INSERT INTO matchmaking_queue (id_equipe, statut, date_inscription)
       VALUES (?, 'en_match', ?)`
		).run(id_equipe, now);

		// Créer le match
		const result = db
			.prepare(
				`INSERT INTO matchs (id_equipe1, id_equipe2, statut, id_perm, date_debut)
         VALUES (?, ?, 'en_cours', ?, ?)`
			)
			.run(adversaire.id_equipe, id_equipe, id_perm ?? null, now);

	const match = db
			.prepare('SELECT * FROM matchs WHERE id = ?')
			.get(result.lastInsertRowid) as Match;
	return { match: enrichirMatch(match) };
}

/** Retire une équipe de la queue (si elle est encore en attente) */
export function quitterQueue(id_equipe: number): void {
	const result = db
		.prepare(
			`UPDATE matchmaking_queue
       SET statut = 'annule'
       WHERE id_equipe = ? AND statut = 'en_attente'`
		)
		.run(id_equipe);

	if (result.changes === 0) {
		throw new Error("L'équipe n'est pas dans la file d'attente.");
	}
}

// ============================================
// MATCHS
// ============================================

/** Retourne tous les matchs en cours */
export function getMatchsEnCours(): MatchComplet[] {
	const matchs = db
		.prepare(`SELECT * FROM matchs WHERE statut = 'en_cours' ORDER BY date_debut DESC`)
		.all() as Match[];

	return matchs.map(enrichirMatch);
}

/** Retourne l'historique de tous les matchs terminés */
export function getHistoriqueMatchs(limit = 50, offset = 0): MatchComplet[] {
	const matchs = db
		.prepare(
			`SELECT * FROM matchs
       WHERE statut = 'termine'
       ORDER BY date_fin DESC
       LIMIT ? OFFSET ?`
		)
		.all(limit, offset) as Match[];

	return matchs.map(enrichirMatch);
}

/** Retourne un match par son id */
export function getMatch(id: number): MatchComplet | null {
	const match = db.prepare('SELECT * FROM matchs WHERE id = ?').get(id) as Match | null;
	return match ? enrichirMatch(match) : null;
}

/** Retourne tous les matchs d'une équipe */
export function getMatchsParEquipe(id_equipe: number): MatchComplet[] {
	const matchs = db
		.prepare(
			`SELECT * FROM matchs
       WHERE id_equipe1 = ? OR id_equipe2 = ?
       ORDER BY date_debut DESC`
		)
		.all(id_equipe, id_equipe) as Match[];

	return matchs.map(enrichirMatch);
}

/**
 * Enregistre la fin d'un match avec l'équipe gagnante.
 * L'équipe gagnante doit être l'une des deux équipes du match.
 */
export function terminerMatch(id_match: number, id_equipe_gagnante: number): MatchComplet {
	const match = db.prepare('SELECT * FROM matchs WHERE id = ?').get(id_match) as Match | null;

	if (!match) throw new Error('Match introuvable.');
	if (match.statut !== 'en_cours') throw new Error('Ce match n\'est pas en cours.');
	if (match.id_equipe1 !== id_equipe_gagnante && match.id_equipe2 !== id_equipe_gagnante) {
		throw new Error("L'équipe gagnante ne participe pas à ce match.");
	}

	const now = Math.floor(Date.now() / 1000);

	db.prepare(
		`UPDATE matchs
     SET statut = 'termine', id_equipe_gagnante = ?, date_fin = ?
     WHERE id = ?`
	).run(id_equipe_gagnante, now, id_match);

	return getMatch(id_match)!;
}

/** Annule un match en cours */
export function annulerMatch(id_match: number): void {
	const match = db.prepare('SELECT * FROM matchs WHERE id = ?').get(id_match) as Match | null;

	if (!match) throw new Error('Match introuvable.');
	if (match.statut !== 'en_cours') throw new Error('Ce match n\'est pas en cours.');

	const now = Math.floor(Date.now() / 1000);

	db.prepare(
		`UPDATE matchs SET statut = 'annule', date_fin = ? WHERE id = ?`
	).run(now, id_match);
}