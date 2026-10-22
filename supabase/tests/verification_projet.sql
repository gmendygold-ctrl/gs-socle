-- Vérification de sécurité sur un VRAI projet Supabase (test ou production).
-- Exécution : éditeur SQL Supabase, ou outil MCP execute_sql.
-- Tout se déroule dans une transaction annulée à la fin : aucune donnée ne reste.
-- Le résultat s'affiche sous forme d'« erreur » RESULTATS_TEST [...] : chaque contrôle doit valoir true.
do $$
declare
  alice uuid; bob uuid; carole uuid; dave uuid; orgA uuid; orgB uuid; dem uuid; n int; ok boolean;
  res jsonb := '[]'::jsonb;
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values (gen_random_uuid(), 'test-alice@gs-socle.invalid', '{"nom_complet":"Alice"}', 'authenticated', 'authenticated') returning id into alice;
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values (gen_random_uuid(), 'test-bob@gs-socle.invalid', '{"nom_complet":"Bob"}', 'authenticated', 'authenticated') returning id into bob;
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values (gen_random_uuid(), 'test-carole@gs-socle.invalid', '{"nom_complet":"Carole"}', 'authenticated', 'authenticated') returning id into carole;
  insert into auth.users (id, email, raw_user_meta_data, aud, role) values (gen_random_uuid(), 'test-dave@gs-socle.invalid', '{"nom_complet":"Dave"}', 'authenticated', 'authenticated') returning id into dave;

  select count(*) = 4 into ok from public.profils where id in (alice,bob,carole,dave);
  res := res || jsonb_build_object('profil auto-créé', ok);

  perform set_config('request.jwt.claims', json_build_object('sub', alice, 'role','authenticated')::text, true);
  set local role authenticated;
  insert into public.organisations (nom, slug) values ('Commune Test A', 'commune-test-a') returning id into orgA;
  insert into public.membres (organisation_id, user_id, role) values (orgA, bob, 'lecteur'), (orgA, carole, 'agent');
  reset role;
  select exists(select 1 from public.membres where organisation_id=orgA and user_id=alice and role='admin') into ok;
  res := res || jsonb_build_object('créateur = admin', ok);

  perform set_config('request.jwt.claims', json_build_object('sub', dave, 'role','authenticated')::text, true);
  set local role authenticated;
  insert into public.organisations (nom, slug) values ('ONG Test B', 'ong-test-b') returning id into orgB;
  select count(*) into n from public.organisations where id = orgA;
  reset role;
  res := res || jsonb_build_object('autre organisation invisible', n = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', carole, 'role','authenticated')::text, true);
  set local role authenticated;
  insert into public.demandes (organisation_id, titre) values (orgA, 'Test forage') returning id into dem;
  reset role;
  res := res || jsonb_build_object('agent crée une demande', dem is not null);

  perform set_config('request.jwt.claims', json_build_object('sub', bob, 'role','authenticated')::text, true);
  begin
    set local role authenticated;
    insert into public.demandes (organisation_id, titre) values (orgA, 'Interdit');
    ok := false;
  exception when insufficient_privilege then ok := true; end;
  reset role;
  res := res || jsonb_build_object('lecteur ne crée pas', ok);

  set local role authenticated;
  update public.membres set role = 'admin' where organisation_id = orgA and user_id = bob;
  get diagnostics n = row_count;
  reset role;
  res := res || jsonb_build_object('lecteur ne se promeut pas', n = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', dave, 'role','authenticated')::text, true);
  set local role authenticated;
  update public.demandes set statut = 'rejetee' where id = dem;
  get diagnostics n = row_count;
  reset role;
  res := res || jsonb_build_object('autre org ne modifie pas', n = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', alice, 'role','authenticated')::text, true);
  begin
    set local role authenticated;
    update public.demandes set organisation_id = orgB where id = dem;
    ok := false;
  exception when insufficient_privilege then ok := true; end;
  reset role;
  res := res || jsonb_build_object('organisation de la demande figée', ok);

  begin
    set local role authenticated;
    update public.membres set role = 'agent' where organisation_id = orgA and user_id = alice;
    ok := false;
  exception when insufficient_privilege then ok := true; end;
  reset role;
  res := res || jsonb_build_object('dernier admin protégé', ok);

  set local role authenticated;
  select count(*) into n from public.journal where organisation_id = orgA;
  reset role;
  res := res || jsonb_build_object('admin lit le journal', n >= 4);
  perform set_config('request.jwt.claims', json_build_object('sub', carole, 'role','authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.journal;
  reset role;
  res := res || jsonb_build_object('agent ne lit pas le journal', n = 0);

  begin
    set local role anon;
    perform 1 from public.demandes limit 1;
    ok := false;
  exception when insufficient_privilege then ok := true; end;
  reset role;
  res := res || jsonb_build_object('anonyme bloqué', ok);

  raise exception 'RESULTATS_TEST %', res::text;
end $$;
