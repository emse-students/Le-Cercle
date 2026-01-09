// Types basés sur le schéma de base de données

export interface User {
    id: number;
    login: string;
	mail: string;
    solde: number;
    role: 'user' | 'cercleux';
    created_at?: string;
}

export interface Contenu {
    id: number;
    nom: string;
    type: string; // Blonde, Brune, etc.
    degre: number;
    description?: string;
}

export interface Contenant {
    id: number;
    nom: string;
    capacite: number; // Litres
    type: 'fut' | 'bouteille_unique' | 'bouteille_partage' | 'cubi' | 'verre';
}

export interface Boisson {
    id: number;
    id_contenu: number;
    id_contenant: number;
    prix_achat: number;
    consigne: number;
    prix_vente: number;
    nb_plein: number;
    nb_vide: number;
    nb_commande: number;
    // Joined data
    contenu?: Contenu;
    contenant?: Contenant;
}

export interface Consommable {
    id: number;
    nom: string;
    prix_vente: number;
}

export interface NomPerm {
    id: number;
    nom: string;
    annee: string;
    is_active: number;
}

export interface Perm {
    id: number;
    id_nom_perm: number;
    date: number; // Unix timestamp
    total_vente: number;
    total_litre: number;
    nom_perm?: NomPerm;
}

export interface Transaction {
    id: number;
    id_user: number;
    id_debiteur: number;
    id_perm: number;
    type: 'B' | 'C' | 'A'; // Boisson, Consommable, Autre
    id_item: number;
    date: number; // Unix timestamp
    nb: number;
    prix: number;
    // Joined data
    user?: User;
    debiteur?: User;
    perm?: Perm;
    item_nom?: string;
}

export interface Constante {
    id: number;
    nom: string;
    valeur: number;
}

export interface YearStats {
    id_user: number;
    annee: number;
    depense: number;
    volume: number;
    alcool: number;
    perm: number;
}
