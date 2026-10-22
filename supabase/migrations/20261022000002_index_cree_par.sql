-- Index sur la clé étrangère organisations.cree_par (alerte « unindexed_foreign_keys » de Supabase).
create index if not exists organisations_cree_par_idx on public.organisations (cree_par);
