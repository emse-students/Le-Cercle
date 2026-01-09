-- Seed data for testing

-- Utilisateurs de test
MERGE INTO users u
USING (SELECT 1 id, 'admin' login, 'Admin' prenom, 'Cercle' nom, 2024 promo, 50.00 solde, 'cercleux' role FROM dual) src
ON (u.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, login, prenom, nom, promo, solde, role) VALUES (src.id, src.login, src.prenom, src.nom, src.promo, src.solde, src.role);

MERGE INTO users u
USING (SELECT 2 id, 'serveur1' login, 'Jean' prenom, 'Dupont' nom, 2024 promo, 25.50 solde, 'user' role FROM dual) src
ON (u.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, login, prenom, nom, promo, solde, role) VALUES (src.id, src.login, src.prenom, src.nom, src.promo, src.solde, src.role);

MERGE INTO users u
USING (SELECT 3 id, 'user1' login, 'Marie' prenom, 'Martin' nom, 2025 promo, -15.00 solde, 'user' role FROM dual) src
ON (u.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, login, prenom, nom, promo, solde, role) VALUES (src.id, src.login, src.prenom, src.nom, src.promo, src.solde, src.role);

MERGE INTO users u
USING (SELECT 4 id, 'user2' login, 'Pierre' prenom, 'Durand' nom, 2025 promo, 10.00 solde, 'user' role FROM dual) src
ON (u.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, login, prenom, nom, promo, solde, role) VALUES (src.id, src.login, src.prenom, src.nom, src.promo, src.solde, src.role);

-- Contenus (boissons)
MERGE INTO contenus c
USING (SELECT 1 id, 'Chouffe' nom, 'Blonde' type, 8.0 degre FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, type, degre) VALUES (src.id, src.nom, src.type, src.degre);

MERGE INTO contenus c
USING (SELECT 2 id, 'Karmeliet' nom, 'Blonde' type, 8.4 degre FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, type, degre) VALUES (src.id, src.nom, src.type, src.degre);

MERGE INTO contenus c
USING (SELECT 3 id, 'Guinness' nom, 'Brune' type, 4.2 degre FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, type, degre) VALUES (src.id, src.nom, src.type, src.degre);

MERGE INTO contenus c
USING (SELECT 4 id, 'Leffe Ruby' nom, 'Fruitée' type, 5.0 degre FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, type, degre) VALUES (src.id, src.nom, src.type, src.degre);

-- Contenants
MERGE INTO contenants c
USING (SELECT 1 id, 'Pinte 50cl' nom, 0.5 capacite, 'verre' type FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, capacite, type) VALUES (src.id, src.nom, src.capacite, src.type);

MERGE INTO contenants c
USING (SELECT 2 id, 'Demi 25cl' nom, 0.25 capacite, 'verre' type FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, capacite, type) VALUES (src.id, src.nom, src.capacite, src.type);

MERGE INTO contenants c
USING (SELECT 3 id, 'Fût 20L' nom, 20.0 capacite, 'fut' type FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, capacite, type) VALUES (src.id, src.nom, src.capacite, src.type);

-- Boissons (combinaisons)
MERGE INTO boissons b
USING (SELECT 1 id, 1 id_contenu, 1 id_contenant, 2.50 prix_achat, 0.00 consigne, 3.00 prix_vente, 10 nb_plein, 5 nb_vide FROM dual) src
ON (b.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, id_contenu, id_contenant, prix_achat, consigne, prix_vente, nb_plein, nb_vide)
  VALUES (src.id, src.id_contenu, src.id_contenant, src.prix_achat, src.consigne, src.prix_vente, src.nb_plein, src.nb_vide);

MERGE INTO boissons b
USING (SELECT 2 id, 1 id_contenu, 2 id_contenant, 1.50 prix_achat, 0.00 consigne, 2.00 prix_vente, 15 nb_plein, 3 nb_vide FROM dual) src
ON (b.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, id_contenu, id_contenant, prix_achat, consigne, prix_vente, nb_plein, nb_vide)
  VALUES (src.id, src.id_contenu, src.id_contenant, src.prix_achat, src.consigne, src.prix_vente, src.nb_plein, src.nb_vide);

MERGE INTO boissons b
USING (SELECT 3 id, 2 id_contenu, 1 id_contenant, 3.00 prix_achat, 0.00 consigne, 3.50 prix_vente, 8 nb_plein, 2 nb_vide FROM dual) src
ON (b.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, id_contenu, id_contenant, prix_achat, consigne, prix_vente, nb_plein, nb_vide)
  VALUES (src.id, src.id_contenu, src.id_contenant, src.prix_achat, src.consigne, src.prix_vente, src.nb_plein, src.nb_vide);

MERGE INTO boissons b
USING (SELECT 4 id, 3 id_contenu, 1 id_contenant, 2.00 prix_achat, 0.00 consigne, 2.50 prix_vente, 20 nb_plein, 10 nb_vide FROM dual) src
ON (b.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, id_contenu, id_contenant, prix_achat, consigne, prix_vente, nb_plein, nb_vide)
  VALUES (src.id, src.id_contenu, src.id_contenant, src.prix_achat, src.consigne, src.prix_vente, src.nb_plein, src.nb_vide);

MERGE INTO boissons b
USING (SELECT 5 id, 4 id_contenu, 1 id_contenant, 2.80 prix_achat, 0.00 consigne, 3.20 prix_vente, 5 nb_plein, 0 nb_vide FROM dual) src
ON (b.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, id_contenu, id_contenant, prix_achat, consigne, prix_vente, nb_plein, nb_vide)
  VALUES (src.id, src.id_contenu, src.id_contenant, src.prix_achat, src.consigne, src.prix_vente, src.nb_plein, src.nb_vide);

-- Consommables
MERGE INTO consommables c
USING (SELECT 1 id, 'Chips' nom, 1.50 prix_vente FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, prix_vente) VALUES (src.id, src.nom, src.prix_vente);

MERGE INTO consommables c
USING (SELECT 2 id, 'Cacahuètes' nom, 1.00 prix_vente FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, prix_vente) VALUES (src.id, src.nom, src.prix_vente);

MERGE INTO consommables c
USING (SELECT 3 id, 'Bretzel' nom, 2.00 prix_vente FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, prix_vente) VALUES (src.id, src.nom, src.prix_vente);

-- Nom de perm
MERGE INTO noms_perms n
USING (SELECT 1 id, 'Perm ICM 2026' nom, '2026' annee, 1 is_active FROM dual) src
ON (n.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, annee, is_active) VALUES (src.id, src.nom, src.annee, src.is_active);

-- Perm active
MERGE INTO perms p
USING (SELECT 1 id, 1 id_nom_perm, SYSTIMESTAMP "date", 0.0 total_vente, 0.0 total_litre FROM dual) src
ON (p.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, id_nom_perm, "date", total_vente, total_litre) VALUES (src.id, src.id_nom_perm, src."date", src.total_vente, src.total_litre);

-- Membres de la perm (serveur1 et admin)
-- Note: 'membres_perms' associe à un Nom de Perm (groupe), 'perm_barmans' à une instance spécifique.
-- Pour la compatibilité avec le seed, on remplit 'membres_perms' si utilisé par legacy,
-- mais surtout on doit remplir 'perm_barmans' pour la perm active ID 1.

-- Barmans pour la perm ID 1
MERGE INTO perm_barmans pb
USING (SELECT 1 id, 1 id_perm, 1 id_user FROM dual) src
ON (pb.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, id_perm, id_user) VALUES (src.id, src.id_perm, src.id_user);

MERGE INTO perm_barmans pb
USING (SELECT 2 id, 1 id_perm, 2 id_user FROM dual) src
ON (pb.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, id_perm, id_user) VALUES (src.id, src.id_perm, src.id_user);

-- Constantes
MERGE INTO constantes c
USING (SELECT 1 id, 'tva' nom, 20.0 valeur FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, valeur) VALUES (src.id, src.nom, src.valeur);

MERGE INTO constantes c
USING (SELECT 2 id, 'consigne_fut' nom, 50.0 valeur FROM dual) src
ON (c.id = src.id)
WHEN NOT MATCHED THEN
  INSERT (id, nom, valeur) VALUES (src.id, src.nom, src.valeur);
