# Nettoyage et clarification du schéma de base de données

## ✅ Tables conservées et clarifiées

### Tables principales
- **`users`** : Utilisateurs avec rôle et statut de cotisation
- **`contenus`** : Types de boissons (Blonde, Brune, etc.)
- **`contenants`** : Types de contenants (fût, bouteille, verre, etc.)
- **`boissons`** : Produits vendables (contenu + contenant + prix)
- **`consommables`** : Produits non-boisson vendables (chips, bonbons, etc.)
- **`noms_perms`** : Templates de perms (ex: "Perm Ski 2025")
- **`perms`** : Instances de perms avec dates et état ouvert/fermé
- **`transactions`** : Historique de toutes les opérations (achats, recharges, cotisations)
- **`constantes`** : Paramètres de configuration
- **`year_stats`** : Statistiques annuelles (conservées temporairement)

### Nouvelles tables créées
- **`config_cotisations`** : Montants des cotisations (sans_alcool, avec_alcool)
- **`perm_barmans`** : Assignation des barmans aux templates de perms
- **`carte_perm`** : Carte personnalisée de chaque perm (boissons/consommables disponibles)

## ❌ Tables supprimées (redondantes)

### `membres_perms`
**Raison de suppression** : Redondant avec `perm_barmans`
- L'objectif initial était probablement de lier les membres du cercle à une perm
- Mais dans la pratique, seuls les barmans ont besoin d'être liés aux perms
- **Remplacement** : `perm_barmans` gère cette relation

### `inventaire_perms`
**Raison de suppression** : Redondant avec `carte_perm`
- L'inventaire était censé tracker les stocks par perm
- Mais la carte personnalisée (`carte_perm`) définit déjà ce qui est disponible
- **Simplification** : On utilise uniquement `carte_perm` pour définir ce qui peut être vendu

### Doublon `perm_barmans` (lignes 148-156)
**Raison de suppression** : Définition dupliquée avec une FK incorrecte
- Première définition (lignes 78-86) : Utilise `id_nom_perm` ✅ (correct)
- Seconde définition (lignes 148-156) : Utilise `id_perm` ❌ (incorrect)
- **Résolution** : Suppression de la seconde définition

## 🔄 Modifications apportées

### `users`
**Avant** :
```sql
role TEXT DEFAULT 'user' CHECK(role IN ('user', 'cercleux'))
```

**Après** :
```sql
role TEXT DEFAULT 'user' CHECK(role IN ('user', 'cercleux')),
statut_cotisation TEXT DEFAULT 'non_cotisant' CHECK(statut_cotisation IN ('non_cotisant', 'cotisant_sans_alcool', 'cotisant_avec_alcool'))
```

### `perms`
**Avant** :
```sql
CREATE TABLE IF NOT EXISTS perms (
    id INTEGER PRIMARY KEY,
    id_nom_perm INTEGER NOT NULL,
    date INTEGER NOT NULL,
    total_vente REAL DEFAULT 0.0,
    total_litre REAL DEFAULT 0.0,
    FOREIGN KEY(id_nom_perm) REFERENCES noms_perms(id)
);
```

**Après** :
```sql
CREATE TABLE IF NOT EXISTS perms (
    id INTEGER PRIMARY KEY,
    id_nom_perm INTEGER NOT NULL,
    date INTEGER NOT NULL,
    total_vente REAL DEFAULT 0.0,
    total_litre REAL DEFAULT 0.0,
    is_open INTEGER DEFAULT 0, -- 0=fermée, 1=ouverte
    FOREIGN KEY(id_nom_perm) REFERENCES noms_perms(id)
);
```

### `transactions`
**Avant** :
```sql
type TEXT NOT NULL, -- B, C, A
id_item INTEGER NOT NULL,
id_perm INTEGER NOT NULL
```

**Après** :
```sql
type TEXT NOT NULL CHECK(type IN ('B', 'C', 'R', 'T')), -- B=Boisson, C=Consommable, R=Recharge, T=coTisation
id_item INTEGER, -- NULL pour recharge/cotisation
id_perm INTEGER -- NULL pour recharges/cotisations hors perm
```

### `carte_perm`
**Avant** :
```sql
type TEXT NOT NULL, -- B ou C
```

**Après** :
```sql
type TEXT NOT NULL CHECK(type IN ('B', 'C')), -- B=Boisson, C=Consommable
```

## 📊 Schéma relationnel final

```
users (role, statut_cotisation)
├── transactions (achats, recharges, cotisations)
│   └── perms (instances avec is_open)
│       └── noms_perms (templates)
└── perm_barmans (assignation barmans)
    └── noms_perms

noms_perms (templates de perms)
├── perms (instances ouvertes/fermées)
├── perm_barmans (barmans assignés)
└── carte_perm (boissons/consommables disponibles)
    ├── boissons (contenu + contenant)
    │   ├── contenus
    │   └── contenants
    └── consommables
```

## 🔧 Actions à effectuer

Pour appliquer ces changements :

```bash
# Réinitialiser la base de données avec le nouveau schéma
bun run db:init
```

⚠️ **Attention** : Cette commande supprimera toutes les données existantes et recréera la base avec le nouveau schéma.

## 📝 Migrations futures

Si vous avez déjà des données en production, créez un script de migration :

```sql
-- Ajouter les colonnes manquantes
ALTER TABLE users ADD COLUMN statut_cotisation TEXT DEFAULT 'non_cotisant';
ALTER TABLE perms ADD COLUMN is_open INTEGER DEFAULT 0;

-- Supprimer les tables redondantes
DROP TABLE IF EXISTS membres_perms;
DROP TABLE IF EXISTS inventaire_perms;

-- Créer les nouvelles tables
-- (voir schema.sql pour les définitions complètes)
```

## 🎯 Bénéfices du nettoyage

1. **Moins de complexité** : 3 tables supprimées, 1 doublon éliminé
2. **Plus clair** : Chaque table a un rôle bien défini et unique
3. **Plus maintenable** : Moins de code à gérer et à debugger
4. **Plus performant** : Moins de jointures inutiles
5. **Mieux documenté** : Relations claires entre les entités
