-- ============================================
-- DONNÉES INITIALES - LE CERCLE
-- ============================================

-- Configuration des cotisations
INSERT OR IGNORE INTO config_cotisations (id, type, montant) 
VALUES (1, 'sans_alcool', 10.0);

INSERT OR IGNORE INTO config_cotisations (id, type, montant) 
VALUES (2, 'avec_alcool', 20.0);

-- Utilisateur système
INSERT OR IGNORE INTO users (id, login, mail, prenom, nom, promo, solde, role, statut_cotisation) 
VALUES (1, 'les.roots', 'les.roots@etu.emse.fr', 'Les', 'Roots', 2024, 0.0, 'cercleux', 'cotisant_avec_alcool');
