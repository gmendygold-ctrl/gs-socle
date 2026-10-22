# Méthode de projet de bout en bout — GS Global

Chaque phase produit un livrable vérifiable. On ne passe à la suivante que lorsque le livrable est validé.

## 1. Cadrage (½ à 2 jours)
**But** : comprendre le besoin réel avant d'écrire du code.
- Entretien : qui sont les utilisateurs, quel problème, quel résultat attendu, quelles contraintes
  (budget, délai, connexion internet, téléphone ou ordinateur, langues, données personnelles).
- Livrable : **cahier des charges court** — objectifs, profils et rôles, parcours principaux,
  périmètre V1 / hors périmètre, critères de réussite mesurables, contraintes légales (CDP).

## 2. Conception (1 à 3 jours)
- **Modèle de données** : tables, relations, qui possède quoi (organisation, utilisateur).
- **Matrice d'accès** : pour chaque rôle et chaque action, autorisé ou non (voir `SECURITE.md`).
- **Parcours et écrans** : maquettes rapides (Lovable ou design) validées par le client.
- **Architecture** : choix techniques justifiés (décision écrite, ADR) ; par défaut ce socle.
- Livrable : dossier de conception validé + maquettes.

## 3. Construction (itérations d'une semaine)
Pour chaque fonctionnalité, dans cet ordre :
1. Migration SQL (tables, RLS, droits, index) **et** ses tests de sécurité.
2. Validation (Zod) et accès aux données (DAL, Server Actions).
3. Interface (accessible, mobile d'abord, messages en français).
4. Test du parcours dans le navigateur (Playwright).
5. `npm run verifier` vert → pull request → relecture → fusion.
- Démonstration au client à la fin de chaque itération (lien de prévisualisation Vercel).

## 4. Qualité et sécurité (en continu + avant livraison)
- Intégration continue verte sur chaque pull request.
- Advisors Supabase sans alerte ; revue de la matrice d'accès ; test d'intrusion simple
  (accès sans compte, accès à une autre organisation, modification de champs interdits).
- Performance : index sur les colonnes filtrées et utilisées par la RLS, pagination.
- Accessibilité : navigation clavier, contrastes, libellés, affichage mobile.

## 5. Recette (avec le client)
- Cahier de recette : chaque parcours du cahier des charges, résultat attendu / obtenu.
- Données réelles ou réalistes (jamais de données personnelles réelles en environnement de test).
- Livrable : procès-verbal de recette signé, liste des réserves.

## 6. Mise en production
- Projet Supabase de production séparé, sauvegardes activées, domaine et e-mails configurés.
- Déploiement Vercel, vérification des parcours clés en production.
- Comptes administrateurs créés, formation des utilisateurs, guide utilisateur court.

## 7. Exploitation et maintenance
- Surveillance : erreurs (Vercel), journaux et performances (Supabase), alertes.
- Mises à jour de sécurité des dépendances (mensuel), sauvegardes vérifiées (trimestriel).
- Évolutions : retour à l'étape 3 ; chaque changement passe par branche + tests + CI.
- Rapport mensuel : disponibilité, incidents, évolutions livrées, prochaines priorités.

## Règles permanentes
- Rien en production sans tests verts et sans accord du client.
- Toute modification de base passe par une migration versionnée.
- Aucun secret dans le code ; seule la clé *publishable* côté navigateur.
- Documentation tenue à jour avec le code (README, ARCHITECTURE, SECURITE, DEPLOIEMENT).
