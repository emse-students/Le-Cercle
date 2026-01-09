-- Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    login TEXT NOT NULL UNIQUE,
    mail TEXT NOT NULL,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    promo INTEGER NOT NULL,
    solde REAL DEFAULT 0.0, -- En euros
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'cercleux')),
    statut_cotisation TEXT DEFAULT 'non_cotisant' CHECK(statut_cotisation IN ('non_cotisant', 'cotisant_sans_alcool', 'cotisant_avec_alcool')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration des cotisations
CREATE TABLE IF NOT EXISTS config_cotisations (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL UNIQUE CHECK(type IN ('sans_alcool', 'avec_alcool')),
    montant REAL NOT NULL -- En euros
);

-- Insertion des valeurs par défaut
INSERT INTO config_cotisations (id, type, montant) VALUES (1, 'sans_alcool', 10.0);
INSERT INTO config_cotisations (id, type, montant) VALUES (2, 'avec_alcool', 20.0);

-- Contenus (boissons - nom, type, degré)
CREATE TABLE IF NOT EXISTS contenus (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL,
    type TEXT NOT NULL, -- Blonde, Brune, Ambrée, etc.
    degre REAL NOT NULL,
    description TEXT
);

-- Contenants (fût, bouteille, etc.)
CREATE TABLE IF NOT EXISTS contenants (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL,
    capacite REAL NOT NULL, -- En litres
    type TEXT NOT NULL -- fut, bouteille_unique, bouteille_partage, cubi, verre
);

-- Boissons (association contenu + contenant + prix)
CREATE TABLE IF NOT EXISTS boissons (
    id INTEGER PRIMARY KEY,
    id_contenu INTEGER NOT NULL,
    id_contenant INTEGER NOT NULL,
    prix_achat REAL NOT NULL,
    consigne REAL NOT NULL DEFAULT 0.0,
    prix_vente REAL NOT NULL,
    nb_plein INTEGER DEFAULT 0,
    nb_vide INTEGER DEFAULT 0,
    nb_commande INTEGER DEFAULT 0,
    FOREIGN KEY(id_contenu) REFERENCES contenus(id),
    FOREIGN KEY(id_contenant) REFERENCES contenants(id)
);

-- Consommables (snacks, etc.)
CREATE TABLE IF NOT EXISTS consommables (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL,
    prix_vente REAL NOT NULL
);

-- Noms de perms
CREATE TABLE IF NOT EXISTS noms_perms (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL,
    annee TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
);

-- Perms (sessions)
CREATE TABLE IF NOT EXISTS perms (
    id INTEGER PRIMARY KEY,
    id_nom_perm INTEGER NOT NULL,
    date INTEGER NOT NULL, -- Timestamp Unix
    total_vente REAL DEFAULT 0.0,
    total_litre REAL DEFAULT 0.0,
    is_open INTEGER DEFAULT 0, -- 0=fermée, 1=ouverte
    FOREIGN KEY(id_nom_perm) REFERENCES noms_perms(id)
);

-- Barmans de perm (utilisateurs autorisés à servir pour cette perm)
CREATE TABLE IF NOT EXISTS perm_barmans (
    id INTEGER PRIMARY KEY,
    id_nom_perm INTEGER NOT NULL,
    id_user INTEGER NOT NULL,
    FOREIGN KEY(id_nom_perm) REFERENCES noms_perms(id),
    FOREIGN KEY(id_user) REFERENCES users(id),
    UNIQUE(id_nom_perm, id_user)
);

-- Carte personnalisée d'une perm (boissons et consommables disponibles)
CREATE TABLE IF NOT EXISTS carte_perm (
    id INTEGER PRIMARY KEY,
    id_nom_perm INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('B', 'C')), -- B=Boisson, C=Consommable
    id_item INTEGER NOT NULL,
    FOREIGN KEY(id_nom_perm) REFERENCES noms_perms(id),
    UNIQUE(id_nom_perm, type, id_item)
);

-- Transactions (B=Boisson, C=Consommable, R=Recharge, T=Cotisation)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_debiteur INTEGER NOT NULL, -- Qui a effectué la transaction (barman ou self)
    id_perm INTEGER, -- NULL pour recharges/cotisations hors perm
    type TEXT NOT NULL CHECK(type IN ('B', 'C', 'R', 'T')), -- B=Boisson, C=Consommable, R=Recharge, T=coTisation
    id_item INTEGER, -- id de l'item acheté (NULL pour recharge/cotisation)
    date INTEGER NOT NULL, -- Timestamp Unix
    nb INTEGER DEFAULT 1, -- Quantité
    prix REAL NOT NULL, -- Prix total (négatif pour achat, positif pour recharge)
    FOREIGN KEY(id_user) REFERENCES users(id),
    FOREIGN KEY(id_debiteur) REFERENCES users(id),
    FOREIGN KEY(id_perm) REFERENCES perms(id)
);

-- Constantes (configuration globale)
CREATE TABLE IF NOT EXISTS constantes (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    valeur REAL NOT NULL
);

-- Stats annuelles
CREATE TABLE IF NOT EXISTS year_stats (
    id_user INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    depense REAL DEFAULT 0.0,
    volume REAL DEFAULT 0.0,
    alcool REAL DEFAULT 0.0,
    perm INTEGER DEFAULT 0,
    PRIMARY KEY(id_user, annee),
    FOREIGN KEY(id_user) REFERENCES users(id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(id_user);
CREATE INDEX IF NOT EXISTS idx_transactions_perm ON transactions(id_perm);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Barmans de perm
CREATE TABLE IF NOT EXISTS perm_barmans (
    id INTEGER PRIMARY KEY,
    id_perm INTEGER NOT NULL,
    id_user INTEGER NOT NULL,
    FOREIGN KEY(id_perm) REFERENCES perms(id),
    FOREIGN KEY(id_user) REFERENCES users(id),
    UNIQUE(id_perm, id_user)
);

CREATE INDEX IF NOT EXISTS idx_perm_barmans_user ON perm_barmans(id_user);
CREATE INDEX IF NOT EXISTS idx_perm_barmans_perm ON perm_barmans(id_perm);