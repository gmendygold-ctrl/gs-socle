# Architecture

```
Navigateur ──► proxy.ts (rafraîchit la session, protège /espace)
              │
              ▼
        Pages (Server Components) ──► DAL src/lib/dal.ts ──► Supabase (RLS)
              │                                   ▲
              ▼                                   │
        Formulaires (Client) ──► Server Actions ──┘  (validation Zod, messages FR)
```

## Dossiers

| Chemin | Rôle |
|---|---|
| `src/proxy.ts`, `src/lib/supabase/proxy.ts` | Session et redirection des pages privées (Next 16 : `proxy` remplace `middleware`) |
| `src/lib/supabase/{client,server}.ts` | Clients Supabase navigateur / serveur |
| `src/lib/dal.ts` | Couche d'accès aux données, côté serveur uniquement (`server-only`) |
| `src/lib/validation/schemas.ts` | Schémas Zod, slug, traduction des erreurs |
| `src/app/auth/*` | Inscription, connexion, confirmation d'e-mail, déconnexion |
| `src/app/espace/*` | Espace connecté : organisations, demandes |
| `supabase/migrations/` | Schéma, RLS, triggers, droits (source de vérité de la base) |
| `supabase/tests/` | Simulation Supabase pour tester les migrations sur PostgreSQL standard |
| `tests/unit`, `tests/db`, `tests/e2e` | Tests unitaires, sécurité base, navigateur |

## Modèle de données

- `organisations` (commune, ONG…) ← `membres` (user + rôle `admin|agent|lecteur`) → `auth.users`
- `profils` : nom affiché (lisible par les collègues d'une même organisation)
- `demandes` : module métier d'exemple, statut `nouvelle|en_cours|traitee|rejetee`
- `journal` : piste d'audit alimentée par triggers, conservée même après suppression

## Ajouter un module métier

1. Migration : table + `organisation_id` + RLS calquée sur `demandes` + `GRANT` explicites + index.
2. Tests de sécurité dans `tests/db/` (lecteur, agent, admin, autre organisation, anonyme).
3. Schéma Zod + Server Actions + fonctions DAL.
4. Pages sous `src/app/espace/[slug]/…` (lecture de session derrière `<Suspense>`).
5. Test Playwright du parcours.
