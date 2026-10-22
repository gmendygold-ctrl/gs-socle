# Déploiement

## Environnements

| Environnement | Supabase | Hébergement | Déclenchement |
|---|---|---|---|
| Développement | projet « dev » (ou branche Supabase) | `npm run dev` | local |
| Prévisualisation | branche Supabase | Vercel Preview | chaque pull request |
| Production | projet « prod » | Vercel Production | fusion sur `main` |

## Mise en place (une fois)

1. **Supabase** : créer le projet (région la plus proche des utilisateurs), activer la confirmation
   d'e-mail, définir l'URL du site et les URL de redirection (`https://domaine/auth/confirmation`).
2. Appliquer les migrations : `supabase link --project-ref <ref>` puis `supabase db push`.
3. **GitHub** : pousser le dépôt ; l'intégration continue (`.github/workflows/qualite.yml`) se lance.
4. **Vercel** : importer le dépôt, renseigner `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (Production et Preview).
5. Domaine : ajouter le domaine dans Vercel, puis l'enregistrement DNS demandé.

## Chaque évolution

1. Branche `feature/<sujet>` → code + migration + tests.
2. `npm run verifier` en local, pull request → CI verte → relecture.
3. Fusion sur `main` → déploiement automatique Vercel ; `supabase db push` sur la production.
4. Vérifier en production (parcours clé), surveiller les journaux (Vercel, Supabase).

## Retour arrière

- Application : « Instant Rollback » Vercel vers le déploiement précédent.
- Base : migration corrective (jamais de modification manuelle non tracée) ; PITR en dernier recours.
