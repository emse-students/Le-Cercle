/**
 * Types de base de données pour Le Cercle
 */

export interface DBUser {
    uuid: string;
    prenom: string;
    nom: string;
    promo: number;
    solde: number;
    role: 'user' | 'cercleux';
    statut_cotisation: 'non_cotisant' | 'cotisant_sans_alcool' | 'cotisant_avec_alcool';
    created_at?: string;
}

export interface DBConfigCotisation {
    id: number;
    type: 'sans_alcool' | 'avec_alcool';
    montant: number;
}

export interface DBContenu {
    id: number;
    nom: string;
    type: string;
    degre: number;
    description: string | null;
}

export interface DBContenant {
    id: number;
    nom: string;
    capacite_ml: number;
    type: 'fut' | 'cubi' | 'bouteille_unique' | 'bouteille_partage' | 'verre' | 'canette' | 'unite';
}

export interface DBBoisson {
    id: number;
    id_contenu: number;
    id_contenant: number;
    prix_achat: number;
    consigne: number;
    prix_vente: number;
    nb_plein: number;
    nb_vide: number;
    nb_commande: number;
    volume_restant: number;
    icone: string;
    description: string | null;
}

export interface DBConsommable {
    id: number;
    nom: string;
    prix_vente: number;
    prix_achat: number;
    stock: number;
    volume_ml: number;
    icone: string;
    description: string | null;
}

export interface DBNomPerm {
    id: number;
    nom: string;
    annee: string;
    est_active: number; // 0 ou 1 en SQLite
}

export interface DBPerm {
    id: number;
    id_nom_perm: number;
    date: number; // Timestamp
    total_vente: number;
    total_litre: number;
    est_ouverte: number; // 0 ou 1
}

export interface DBPermBarman {
    id: number;
    id_perm: number;
    uuid_user: string;
}

export interface DBCartePerm {
    id: number;
    id_nom_perm: number;
    type: 'B' | 'C'; // B pour Boisson, C pour Consommable
    id_item: number;
}

export interface DBTransaction {
    id: number;
    uuid_user: string;
    uuid_debiteur: string;
    id_perm: number | null;
    type: 'B' | 'C' | 'R' | 'T'; // B Boisson, C Consommable, R Rechargement, T jsp
    id_item: number | null;
    date: number; // Timestamp
    nb: number;
    prix: number;
}

export interface DBYearStats {
    id_user: string;
    annee: number;
    depense: number;
    volume: number;
    alcool: number;
    perm: number;
}

/*********************************/
/* Types pour les matchs de perm */
/*********************************/

export interface DBEquipe {
    id: number;
    nom: string;
    uuid_joueur1: string;
    uuid_joueur2: string;
    is_ephemere: number; // 0 ou 1
    created_at?: string;
}


export interface DBMatchmakingQueue {
    id: number;
    id_equipe: number;
    statut: 'en_attente' | 'en_match' | 'annule';
    date_inscription: number; // Timestamp
}

export interface DBMatch {
    id: number;
    id_equipe1: number;
    id_equipe2: number;
    id_equipe_gagnante: number | null;
    statut: 'en_cours' | 'termine' | 'annule';
    id_perm: number | null;
    date_debut: number; // Timestamp
    date_fin: number | null; // Timestamp ou null
}