-- ============================================
-- SCHÉMA BASE DE DONNÉES - LE CERCLE
-- ============================================

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    uuid TEXT PRIMARY KEY,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    promo INTEGER NOT NULL,
    solde REAL NOT NULL DEFAULT 0.0,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'cercleux')),
    statut_cotisation TEXT NOT NULL DEFAULT 'non_cotisant' CHECK(statut_cotisation IN ('non_cotisant', 'cotisant_sans_alcool', 'cotisant_avec_alcool')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration des cotisations
CREATE TABLE IF NOT EXISTS config_cotisations (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL UNIQUE CHECK(type IN ('sans_alcool', 'avec_alcool')),
    montant REAL NOT NULL
);

-- Contenus de boissons
CREATE TABLE IF NOT EXISTS contenus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    type TEXT NOT NULL,
    degre REAL NOT NULL,
    description TEXT
);

-- Contenants
CREATE TABLE IF NOT EXISTS contenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    capacite_ml REAL NOT NULL, -- Volume en mL pour précision
    type TEXT NOT NULL CHECK(type IN ('fut', 'cubi', 'bouteille_unique', 'bouteille_partage', 'verre', 'canette', 'unite'))
);

-- Boissons
CREATE TABLE IF NOT EXISTS boissons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_contenu INTEGER NOT NULL,
    id_contenant INTEGER NOT NULL,
    prix_achat REAL NOT NULL DEFAULT 0.0,
    consigne REAL NOT NULL DEFAULT 0.0,
    prix_vente REAL NOT NULL,
    nb_plein INTEGER NOT NULL DEFAULT 0,
    nb_vide INTEGER NOT NULL DEFAULT 0,
    nb_commande INTEGER NOT NULL DEFAULT 0,
    volume_restant REAL NOT NULL DEFAULT 0.0,
    icone TEXT NOT NULL DEFAULT 'Beer',
    description TEXT,
    FOREIGN KEY(id_contenu) REFERENCES contenus(id) ON DELETE CASCADE,
    FOREIGN KEY(id_contenant) REFERENCES contenants(id) ON DELETE CASCADE
);

-- Consommables
CREATE TABLE IF NOT EXISTS consommables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prix_vente REAL NOT NULL,
    prix_achat REAL NOT NULL DEFAULT 0.0,
    stock INTEGER NOT NULL DEFAULT 0,
    volume_ml REAL NOT NULL DEFAULT 0.0, -- Pour le calcul Qualité/Cuite si applicable
    icone TEXT NOT NULL DEFAULT 'Utensils',
    description TEXT
);

-- Noms de permanences
CREATE TABLE IF NOT EXISTS noms_perms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    annee TEXT NOT NULL,
    est_active INTEGER NOT NULL DEFAULT 1
);

-- Permanences
CREATE TABLE IF NOT EXISTS perms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_nom_perm INTEGER NOT NULL,
    date INTEGER NOT NULL,
    total_vente REAL NOT NULL DEFAULT 0.0,
    total_litre REAL NOT NULL DEFAULT 0.0,
    est_ouverte INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(id_nom_perm) REFERENCES noms_perms(id) ON DELETE CASCADE
);

-- Barmans de permanence
CREATE TABLE IF NOT EXISTS perm_barmans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_perm INTEGER NOT NULL,
    uuid_user TEXT NOT NULL,
    FOREIGN KEY(id_perm) REFERENCES perms(id) ON DELETE CASCADE,
    FOREIGN KEY(uuid_user) REFERENCES users(uuid) ON DELETE CASCADE,
    UNIQUE(id_perm, uuid_user)
);

-- Carte personnalisée par permanence
CREATE TABLE IF NOT EXISTS carte_perm (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_nom_perm INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('B', 'C')),
    id_item INTEGER NOT NULL,
    FOREIGN KEY(id_nom_perm) REFERENCES noms_perms(id) ON DELETE CASCADE,
    UNIQUE(id_nom_perm, type, id_item)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid_user TEXT NOT NULL,
    uuid_debiteur TEXT NOT NULL,
    id_perm INTEGER,
    type TEXT NOT NULL CHECK(type IN ('B', 'C', 'R', 'T')),
    id_item INTEGER,
    date INTEGER NOT NULL,
    nb INTEGER NOT NULL DEFAULT 1,
    prix REAL NOT NULL,
    FOREIGN KEY(uuid_user) REFERENCES users(uuid) ON DELETE CASCADE,
    FOREIGN KEY(uuid_debiteur) REFERENCES users(uuid) ON DELETE CASCADE,
    FOREIGN KEY(id_perm) REFERENCES perms(id) ON DELETE SET NULL
);

-- Statistiques annuelles
CREATE TABLE IF NOT EXISTS year_stats (
    id_user TEXT NOT NULL,
    annee INTEGER NOT NULL,
    depense REAL NOT NULL DEFAULT 0.0,
    volume REAL NOT NULL DEFAULT 0.0,
    alcool REAL NOT NULL DEFAULT 0.0,
    perm INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(id_user, annee),
    FOREIGN KEY(id_user) REFERENCES users(id) ON DELETE CASCADE
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(uuid_user);
CREATE INDEX IF NOT EXISTS idx_transactions_perm ON transactions(id_perm);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_perm_barmans_user ON perm_barmans(uuid_user);
CREATE INDEX IF NOT EXISTS idx_perm_barmans_perm ON perm_barmans(id_perm);


-- ============================== --
-- Schéma pour les matchs en perm --
-- ============================== --

CREATE TABLE IF NOT EXISTS equipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL UNIQUE,
    uuid_joueur1 TEXT NOT NULL,
    uuid_joueur2 TEXT NOT NULL,
    is_ephemere INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_equipe INTEGER NOT NULL UNIQUE,
    statut TEXT NOT NULL DEFAULT 'en_attente' CHECK(statut IN ('en_attente', 'en_match', 'annule')),
    date_inscription INTEGER NOT NULL,
    FOREIGN KEY(id_equipe) REFERENCES equipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matchs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_equipe1 INTEGER NOT NULL,
    id_equipe2 INTEGER NOT NULL,
    id_equipe_gagnante INTEGER, -- NULL tant que le match n'est pas terminé
    statut TEXT NOT NULL DEFAULT 'en_cours' CHECK(statut IN ('en_cours', 'termine', 'annule')),
    id_perm INTEGER,                     -- optionnel : rattacher à une perm
    date_debut INTEGER NOT NULL,
    date_fin INTEGER, -- NULL tant que pas terminé
    FOREIGN KEY(id_equipe1) REFERENCES equipes(id),
    FOREIGN KEY(id_equipe2) REFERENCES equipes(id),
    FOREIGN KEY(id_equipe_gagnante) REFERENCES equipes(id),
    FOREIGN KEY(id_perm) REFERENCES perms(id) ON DELETE SET NULL,
    CHECK(id_equipe1 != id_equipe2)
);