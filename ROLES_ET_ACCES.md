# Système de rôles et d'accès - Le Cercle

## Rôles et Statuts

### Rôle utilisateur
Un utilisateur peut avoir l'un des deux rôles suivants :
- **Utilisateur** (`user`) : Utilisateur standard
- **Cercleux** (`cercleux`) : Accès à l'interface d'administration complète

### Statut de cotisation
Chaque utilisateur a un statut de cotisation indépendant de son rôle :
- **Non cotisant** (`non_cotisant`) : Accès limité
- **Cotisant sans alcool** (`cotisant_sans_alcool`) : Cotisation payée, sans accès aux boissons alcoolisées
- **Cotisant avec alcool** (`cotisant_avec_alcool`) : Cotisation complète

Les montants des cotisations sont configurables dans l'interface Admin (table `config_cotisations`).

### Barman de perm
- **Tout utilisateur** (cotisant ou non) peut être assigné comme barman d'une perm
- L'assignation se fait lors de la création/modification d'une perm (table `perm_barmans`)
- Un barman n'a accès à la page "Service" que lorsque **la perm à laquelle il est assigné est ouverte** (`is_open = 1`)

## Droits d'accès

### Utilisateur non cotisant
- ✅ Page d'accueil et informations générales
- ✅ Visualisation de la carte des boissons et consommables
- ✅ Page de cotisation (pour payer sa cotisation)
- ❌ Accès au compte personnel
- ❌ Recharge de solde
- ❌ Achat de consommations
- ❌ Page Service (sauf si barman d'une perm ouverte)

### Utilisateur cotisant (sans ou avec alcool)
- ✅ Toutes les fonctionnalités d'un non cotisant
- ✅ Accès au compte personnel
- ✅ Visualisation de l'historique des transactions
- ✅ Recharge de solde
- ✅ Achat de consommations (selon le statut alcool/sans alcool)
- ✅ Page Service (si barman d'une perm ouverte)

### Barman (utilisateur assigné à une perm ouverte)
- ✅ Accès à la page "Service" pour encaisser et servir
- ✅ Droits limités à la durée d'ouverture de la perm
- ⚠️ Peut être cotisant ou non cotisant

### Cercleux (administrateur)
- ✅ Accès complet à l'interface d'administration (`/admin`)
- ✅ Gestion des utilisateurs (création, modification, suppression, gestion des rôles et statuts)
- ✅ Gestion des perms (création, ouverture/fermeture, modification, suppression)
- ✅ Configuration des cotisations (montants personnalisables)
- ✅ Gestion des boissons et consommables
- ✅ Attribution des barmans aux perms
- ✅ Personnalisation de la carte par perm
- ✅ Recharge manuelle des comptes utilisateurs
- ✅ Visualisation de toutes les transactions

## Tables de base de données concernées

### `users`
- `role` : `'user'` ou `'cercleux'`
- `statut_cotisation` : `'non_cotisant'`, `'cotisant_sans_alcool'`, `'cotisant_avec_alcool'`

### `config_cotisations`
Stocke les montants configurables des cotisations :
- `sans_alcool` : montant de la cotisation sans alcool (défaut 10€)
- `avec_alcool` : montant de la cotisation avec alcool (défaut 20€)

### `perm_barmans`
Lie les utilisateurs aux perms pour lesquelles ils sont barmans :
- `id_nom_perm` : référence au template de perm (`noms_perms`)
- `id_user` : référence à l'utilisateur assigné comme barman

### `perms`
- `is_open` : `0` (fermée) ou `1` (ouverte)
- Seules les perms ouvertes donnent accès à la page Service aux barmans assignés

### `carte_perm`
Personnalisation de la carte des boissons/consommables disponibles par perm :
- `id_nom_perm` : référence au template de perm
- `type` : `'B'` (boisson) ou `'C'` (consommable)
- `id_item` : référence à la boisson ou au consommable

### `transactions`
- `type` : `'B'` (boisson), `'C'` (consommable), `'R'` (recharge), `'T'` (cotisation)
- `id_perm` : `NULL` pour les recharges et cotisations hors perm
- `prix` : négatif pour les achats, positif pour les recharges

## Schéma simplifié

```
┌──────────────┐
│    Users     │
├──────────────┤
│ role         │ → 'user' | 'cercleux'
│ statut_coti  │ → 'non_cotisant' | 'cotisant_sans_alcool' | 'cotisant_avec_alcool'
└──────────────┘
       │
       │ assigned to
       ↓
┌──────────────┐     ┌──────────────┐
│ perm_barmans │ ←→  │ noms_perms   │
└──────────────┘     └──────────────┘
       │                    │
       │                    │ instantiated as
       ↓                    ↓
┌──────────────┐     ┌──────────────┐
│   Service    │ ←→  │    perms     │
│  (si open)   │     │  is_open     │
└──────────────┘     └──────────────┘
```

## Workflow de cotisation

1. Un nouvel utilisateur est créé avec `statut_cotisation = 'non_cotisant'`
2. L'utilisateur se connecte et voit uniquement la carte et l'interface de cotisation
3. Il paie sa cotisation (via transaction de type `'T'`)
4. Un cercleux met à jour son `statut_cotisation` à `'cotisant_sans_alcool'` ou `'cotisant_avec_alcool'`
5. L'utilisateur a maintenant accès à son compte et peut recharger son solde

## Workflow de perm

1. Un cercleux crée un template de perm dans `noms_perms` (ex: "Perm Ski 2025")
2. Il assigne des barmans via `perm_barmans` (lien avec `id_nom_perm`)
3. Il personnalise la carte disponible via `carte_perm`
4. Lors de l'ouverture d'une perm, une entrée est créée dans `perms` avec `is_open = 1`
5. Les barmans assignés peuvent accéder à la page Service
6. À la fermeture, `is_open` passe à `0` et les barmans perdent l'accès
