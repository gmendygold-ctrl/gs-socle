# Sécurité

## Principes

1. **La base est la barrière** : la RLS décide de ce que chaque utilisateur peut lire ou écrire.
   L'application ne fait que des vérifications d'ergonomie.
2. **Rien d'exposé par défaut** : `GRANT` explicites (Supabase n'expose plus automatiquement les
   nouvelles tables depuis 2026), aucun accès anonyme aux données métier.
3. **Moindre privilège par colonne** : seules les colonnes prévues sont modifiables
   (ex. `demandes` : titre, description, statut, assignation ; `membres` : rôle).
4. **Champs figés** : organisation et créateur d'une demande ne changent jamais (trigger).
5. **Fonctions privilégiées** dans le schéma `private`, `search_path` vide, `auth.uid()` vérifié.
6. **Toujours au moins un admin** par organisation (trigger).
7. **Traçabilité** : toute création / modification / suppression est journalisée.
8. **Pas de fuite d'information** : messages d'erreur génériques, inscription qui ne révèle pas
   si une adresse existe, redirections limitées aux chemins internes.
9. **Secrets** : seule la clé *publishable* est côté navigateur ; jamais de clé secrète en `NEXT_PUBLIC_`.

## Matrice d'accès (vérifiée par `tests/db/securite.test.ts`)

| Action | Anonyme | Lecteur | Agent | Admin | Autre organisation |
|---|---|---|---|---|---|
| Voir l'organisation et ses demandes | ✗ | ✓ | ✓ | ✓ | ✗ |
| Créer / modifier une demande | ✗ | ✗ | ✓ | ✓ | ✗ |
| Supprimer une demande | ✗ | ✗ | ✗ | ✓ | ✗ |
| Gérer les membres et rôles | ✗ | ✗ | ✗ | ✓ | ✗ |
| Lire le journal d'audit | ✗ | ✗ | ✗ | ✓ | ✗ |

## Points de contrôle avant mise en production

- [ ] Advisors Supabase (sécurité + performance) sans alerte
- [ ] Confirmation d'e-mail activée, modèle d'e-mail pointant vers `/auth/confirmation`
- [ ] Limites de débit Auth configurées ; MFA pour les administrateurs si données sensibles
- [ ] Données personnelles : base légale, durée de conservation, déclaration CDP (Sénégal)
- [ ] Sauvegardes (PITR) activées sur le projet Supabase de production
