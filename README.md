# Socle GS Global — Next.js + Supabase

Base de départ sécurisée pour les plateformes GS Global (communes, ONG, entreprises) :
comptes utilisateurs, organisations, rôles, module métier d'exemple (« demandes »), journal d'audit,
tests automatiques et intégration continue.

## Contenu

| Domaine | Choix |
|---|---|
| Application | Next.js 16 (App Router, Server Actions, Cache Components), React 19, TypeScript |
| Interface | Tailwind CSS 4, charte GS Global, formulaires accessibles (labels, erreurs par champ) |
| Données | Supabase (PostgreSQL, Auth), clés *publishable*, `@supabase/ssr` |
| Sécurité | RLS sur toutes les tables, droits par colonne, fonctions privilégiées isolées, journal d'audit |
| Validation | Zod (côté serveur, messages en français) |
| Tests | Vitest (unitaires + sécurité de la base sur PostgreSQL réel), Playwright (bureau + mobile) |
| Qualité | ESLint, TypeScript strict, GitHub Actions |

## Démarrer

```bash
npm ci
cp .env.example .env.local     # renseigner l'URL et la clé publishable Supabase
npm run dev                    # http://localhost:3000
```

Appliquer la migration `supabase/migrations/*.sql` sur le projet Supabase (CLI `supabase db push`,
ou outil MCP `apply_migration`), puis régénérer `src/lib/supabase/types.ts`.

## Vérifier

```bash
npm run verifier   # lint + typage + tests unitaires + tests base + build + tests navigateur
npm run test:db    # nécessite PostgreSQL (TEST_DATABASE_URL, défaut postgres://postgres:postgres@localhost:5432/postgres)
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Sécurité](docs/SECURITE.md)
- [Déploiement](docs/DEPLOIEMENT.md)
- [Méthode de projet](docs/METHODE.md)
