-- =====================================================================
-- Socle GS Global — schéma initial
-- Modèle multi-organisations (commune, ONG, entreprise) avec rôles.
--   organisations  : structures clientes
--   membres        : appartenance d'un utilisateur à une organisation + rôle
--   profils        : informations publiques minimales d'un utilisateur
--   demandes       : exemple de module métier (dossiers / requêtes)
--   journal        : piste d'audit (qui a fait quoi, quand)
--
-- Principes de sécurité appliqués :
--   * RLS activée sur toutes les tables exposées
--   * droits explicites (GRANT) : les nouvelles tables ne sont plus exposées
--     automatiquement à l'API Supabase depuis 2026
--   * aucun accès anonyme aux données métier
--   * fonctions privilégiées dans un schéma privé, search_path vide,
--     vérification de auth.uid() dans le corps
--   * colonnes sensibles (rôle, créateur, organisation) protégées par trigger
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------- types
create type public.role_membre as enum ('admin', 'agent', 'lecteur');
create type public.statut_demande as enum ('nouvelle', 'en_cours', 'traitee', 'rejetee');

-- ---------------------------------------------------------------- tables
create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null check (char_length(nom) between 2 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  cree_par    uuid not null default auth.uid() references auth.users(id),
  created_at  timestamptz not null default now()
);

create table public.membres (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.role_membre not null default 'lecteur',
  created_at      timestamptz not null default now(),
  primary key (organisation_id, user_id)
);
create index membres_user_id_idx on public.membres (user_id);

create table public.profils (
  id          uuid primary key references auth.users(id) on delete cascade,
  nom_complet text check (char_length(nom_complet) <= 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.demandes (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  titre           text not null check (char_length(titre) between 3 and 160),
  description     text check (char_length(description) <= 5000),
  statut          public.statut_demande not null default 'nouvelle',
  cree_par        uuid not null default auth.uid() references auth.users(id),
  assigne_a       uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index demandes_organisation_idx on public.demandes (organisation_id, created_at desc);
create index demandes_cree_par_idx on public.demandes (cree_par);
create index demandes_assigne_a_idx on public.demandes (assigne_a);

create table public.journal (
  id              bigint generated always as identity primary key,
  -- pas de clé étrangère : la piste d'audit survit à la suppression de l'organisation
  organisation_id uuid,
  table_nom       text not null,
  ligne_id        text not null,
  action          text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  auteur          uuid,
  details         jsonb,
  created_at      timestamptz not null default now()
);
create index journal_organisation_idx on public.journal (organisation_id, created_at desc);

-- ---------------------------------------------------------------- fonctions privées
-- Rôle de l'utilisateur courant dans une organisation (null si non membre).
create or replace function private.role_dans(org uuid)
returns public.role_membre
language sql stable security definer set search_path = ''
as $$
  select m.role from public.membres m
  where m.organisation_id = org and m.user_id = (select auth.uid());
$$;

create or replace function private.a_role(org uuid, roles public.role_membre[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.role_dans(org) = any (roles), false);
$$;

-- Deux utilisateurs partagent-ils une organisation ? (lecture des profils)
create or replace function private.partage_organisation(autre uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.membres a join public.membres b using (organisation_id)
    where a.user_id = (select auth.uid()) and b.user_id = autre
  );
$$;

revoke all on function private.role_dans(uuid) from public;
revoke all on function private.a_role(uuid, public.role_membre[]) from public;
revoke all on function private.partage_organisation(uuid) from public;
grant execute on function private.role_dans(uuid) to authenticated;
grant execute on function private.a_role(uuid, public.role_membre[]) to authenticated;
grant execute on function private.partage_organisation(uuid) to authenticated;

-- ---------------------------------------------------------------- triggers
create or replace function private.maj_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profils_updated_at before update on public.profils
  for each row execute function private.maj_updated_at();
create trigger demandes_updated_at before update on public.demandes
  for each row execute function private.maj_updated_at();

-- Le créateur d'une organisation en devient automatiquement admin.
create or replace function private.createur_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.membres (organisation_id, user_id, role)
  values (new.id, new.cree_par, 'admin');
  return new;
end $$;
create trigger organisations_createur_admin after insert on public.organisations
  for each row execute function private.createur_admin();

-- Profil créé à l'inscription (nom lu dans les métadonnées : affichage uniquement,
-- jamais utilisé pour une décision d'autorisation).
create or replace function private.nouvel_utilisateur()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profils (id, nom_complet)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'nom_complet', ''), 120))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger auth_nouvel_utilisateur after insert on auth.users
  for each row execute function private.nouvel_utilisateur();

-- Champs non modifiables d'une demande (organisation, créateur).
create or replace function private.demandes_champs_figes()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.organisation_id is distinct from old.organisation_id
     or new.cree_par is distinct from old.cree_par then
    raise exception 'organisation_id et cree_par ne sont pas modifiables' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger demandes_champs_figes before update on public.demandes
  for each row execute function private.demandes_champs_figes();

-- Un admin ne peut pas se retirer le dernier rôle admin de son organisation.
create or replace function private.garder_un_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  org uuid := coalesce(old.organisation_id, new.organisation_id);
begin
  -- suppression de l'organisation entière (cascade) : rien à protéger
  if tg_op = 'DELETE' and not exists (select 1 from public.organisations where id = org) then
    return old;
  end if;
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin') then
    if not exists (
      select 1 from public.membres
      where organisation_id = org and role = 'admin' and user_id <> old.user_id
    ) then
      raise exception 'Une organisation doit garder au moins un admin' using errcode = '42501';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger membres_garder_un_admin before update or delete on public.membres
  for each row execute function private.garder_un_admin();

-- Piste d'audit.
create or replace function private.journaliser()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  ligne jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.journal (organisation_id, table_nom, ligne_id, action, auteur, details)
  values (
    coalesce(ligne ->> 'organisation_id', case when tg_table_name = 'organisations' then ligne ->> 'id' end)::uuid,
    tg_table_name,
    coalesce(ligne ->> 'id', ligne ->> 'user_id'),
    tg_op,
    (select auth.uid()),
    case when tg_op = 'UPDATE' then jsonb_build_object('avant', to_jsonb(old), 'apres', to_jsonb(new)) else ligne end
  );
  return coalesce(new, old);
end $$;
create trigger demandes_journal after insert or update or delete on public.demandes
  for each row execute function private.journaliser();
create trigger membres_journal after insert or update or delete on public.membres
  for each row execute function private.journaliser();
create trigger organisations_journal after insert or update or delete on public.organisations
  for each row execute function private.journaliser();

-- ---------------------------------------------------------------- RLS
alter table public.organisations enable row level security;
alter table public.membres       enable row level security;
alter table public.profils       enable row level security;
alter table public.demandes      enable row level security;
alter table public.journal       enable row level security;

-- organisations
-- « ou créateur » : nécessaire pour INSERT ... RETURNING (le client relit la ligne
-- créée avant que le trigger ne l'ait ajouté comme membre).
create policy "organisations : lecture par les membres" on public.organisations
  for select to authenticated
  using ((select private.role_dans(id)) is not null or cree_par = (select auth.uid()));
create policy "organisations : création par un utilisateur connecté" on public.organisations
  for insert to authenticated
  with check (cree_par = (select auth.uid()));
create policy "organisations : modification par les admins" on public.organisations
  for update to authenticated
  using ((select private.a_role(id, '{admin}')))
  with check ((select private.a_role(id, '{admin}')));
create policy "organisations : suppression par les admins" on public.organisations
  for delete to authenticated
  using ((select private.a_role(id, '{admin}')));

-- membres
create policy "membres : lecture au sein de l'organisation" on public.membres
  for select to authenticated
  using ((select private.role_dans(organisation_id)) is not null);
create policy "membres : ajout par les admins" on public.membres
  for insert to authenticated
  with check ((select private.a_role(organisation_id, '{admin}')));
create policy "membres : changement de rôle par les admins" on public.membres
  for update to authenticated
  using ((select private.a_role(organisation_id, '{admin}')))
  with check ((select private.a_role(organisation_id, '{admin}')));
create policy "membres : retrait par les admins ou départ volontaire" on public.membres
  for delete to authenticated
  using ((select private.a_role(organisation_id, '{admin}')) or user_id = (select auth.uid()));

-- profils
create policy "profils : lecture de soi et des collègues" on public.profils
  for select to authenticated
  using (id = (select auth.uid()) or (select private.partage_organisation(id)));
create policy "profils : modification de soi" on public.profils
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- demandes
create policy "demandes : lecture par les membres" on public.demandes
  for select to authenticated
  using ((select private.role_dans(organisation_id)) is not null);
create policy "demandes : création par admins et agents" on public.demandes
  for insert to authenticated
  with check (
    cree_par = (select auth.uid())
    and (select private.a_role(organisation_id, '{admin,agent}'))
  );
create policy "demandes : modification par admins et agents" on public.demandes
  for update to authenticated
  using ((select private.a_role(organisation_id, '{admin,agent}')))
  with check ((select private.a_role(organisation_id, '{admin,agent}')));
create policy "demandes : suppression par les admins" on public.demandes
  for delete to authenticated
  using ((select private.a_role(organisation_id, '{admin}')));

-- journal : lecture admin seulement, écriture uniquement par trigger
create policy "journal : lecture par les admins" on public.journal
  for select to authenticated
  using ((select private.a_role(organisation_id, '{admin}')));

-- ---------------------------------------------------------------- droits API
revoke all on public.organisations, public.membres, public.profils, public.demandes, public.journal from anon, authenticated;
grant select, insert, update, delete on public.organisations, public.membres, public.demandes to authenticated;
grant select on public.journal to authenticated;
grant select on public.profils to authenticated;
grant update (nom_complet) on public.profils to authenticated;
-- colonnes modifiables d'une organisation et d'une demande (le reste est figé)
revoke update on public.organisations from authenticated;
grant update (nom, slug) on public.organisations to authenticated;
revoke update on public.demandes from authenticated;
grant update (titre, description, statut, assigne_a) on public.demandes to authenticated;
revoke update on public.membres from authenticated;
grant update (role) on public.membres to authenticated;
