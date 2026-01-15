-- ============================================
-- SCHÉMA BASE DE DONNÉES - LE CERCLE
-- ============================================

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    mail TEXT NOT NULL DEFAULT '',
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
    capacite REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('fut', 'cubi', 'bouteille_unique', 'bouteille_partage', 'verre'))
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
    icone TEXT NOT NULL DEFAULT 'Utensils',
    description TEXT
);

-- Noms de permanences
CREATE TABLE IF NOT EXISTS noms_perms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    annee TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- Permanences
CREATE TABLE IF NOT EXISTS perms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_nom_perm INTEGER NOT NULL,
    date INTEGER NOT NULL,
    total_vente REAL NOT NULL DEFAULT 0.0,
    total_litre REAL NOT NULL DEFAULT 0.0,
    is_open INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(id_nom_perm) REFERENCES noms_perms(id) ON DELETE CASCADE
);

-- Barmans de permanence
CREATE TABLE IF NOT EXISTS perm_barmans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_perm INTEGER NOT NULL,
    id_user INTEGER NOT NULL,
    FOREIGN KEY(id_perm) REFERENCES perms(id) ON DELETE CASCADE,
    FOREIGN KEY(id_user) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(id_perm, id_user)
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
    id_user INTEGER NOT NULL,
    id_debiteur INTEGER NOT NULL,
    id_perm INTEGER,
    type TEXT NOT NULL CHECK(type IN ('B', 'C', 'R', 'T')),
    id_item INTEGER,
    date INTEGER NOT NULL,
    nb INTEGER NOT NULL DEFAULT 1,
    prix REAL NOT NULL,
    FOREIGN KEY(id_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(id_debiteur) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(id_perm) REFERENCES perms(id) ON DELETE SET NULL
);

-- Statistiques annuelles
CREATE TABLE IF NOT EXISTS year_stats (
    id_user INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    depense REAL NOT NULL DEFAULT 0.0,
    volume REAL NOT NULL DEFAULT 0.0,
    alcool REAL NOT NULL DEFAULT 0.0,
    perm INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(id_user, annee),
    FOREIGN KEY(id_user) REFERENCES users(id) ON DELETE CASCADE
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(id_user);
CREATE INDEX IF NOT EXISTS idx_transactions_perm ON transactions(id_perm);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_perm_barmans_user ON perm_barmans(id_user);
CREATE INDEX IF NOT EXISTS idx_perm_barmans_perm ON perm_barmans(id_perm);