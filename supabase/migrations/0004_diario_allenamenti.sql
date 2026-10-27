-- =====================================================================
-- FurinkazApp · 0004 diario degli allenamenti
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0003.
-- =====================================================================

-- Un allenamento: quando, quanto, su cosa si è lavorato e cosa si è fatto.
-- "argomenti" contiene chiavi definite in src/lib/domain/diario.ts (es. {kihon,kumite}).
create table public.allenamenti (
  id           uuid primary key default gen_random_uuid(),
  dojo_id      uuid not null references public.dojos (id) on delete cascade,
  data         date not null default current_date,
  durata_min   smallint check (durata_min between 1 and 600),
  argomenti    text[] not null default '{}',
  titolo       text,
  descrizione  text not null default '',
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, dojo_id)
);
create index on public.allenamenti (dojo_id, data desc);

-- Chi era presente.
create table public.presenze (
  allenamento_id  uuid not null,
  dojo_id         uuid not null,
  atleta_id       uuid not null,
  primary key (allenamento_id, atleta_id),
  foreign key (allenamento_id, dojo_id) references public.allenamenti (id, dojo_id) on delete cascade,
  foreign key (atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete cascade
);
create index on public.presenze (atleta_id);

alter table public.allenamenti enable row level security;
alter table public.presenze enable row level security;

-- Tutto il dojo legge il diario; scrivono amministratori e istruttori.
create policy allenamenti_leggi on public.allenamenti for select using (public.is_membro(dojo_id));
create policy allenamenti_inserisci on public.allenamenti for insert with check (public.is_staff(dojo_id));
create policy allenamenti_modifica on public.allenamenti for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy allenamenti_elimina on public.allenamenti for delete using (public.is_staff(dojo_id));

create policy presenze_leggi on public.presenze for select using (public.is_membro(dojo_id));
create policy presenze_inserisci on public.presenze for insert with check (public.is_staff(dojo_id));
create policy presenze_elimina on public.presenze for delete using (public.is_staff(dojo_id));

create trigger allenamenti_updated_at before update on public.allenamenti
  for each row execute function public.tocca_updated_at();

-- Crea o aggiorna un allenamento con le presenze in un'unica operazione.
-- Rispetta i permessi di chi chiama (security invoker).
create or replace function public.salva_allenamento(p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  a uuid := nullif(p ->> 'id', '')::uuid;
  d uuid := (p ->> 'dojo_id')::uuid;
begin
  if a is null then
    insert into public.allenamenti (dojo_id, data, durata_min, argomenti, titolo, descrizione)
    values (d, coalesce((p ->> 'data')::date, current_date), nullif(p ->> 'durata_min', '')::smallint,
            coalesce(array(select jsonb_array_elements_text(p -> 'argomenti')), '{}'),
            nullif(p ->> 'titolo', ''), coalesce(p ->> 'descrizione', ''))
    returning id into a;
  else
    update public.allenamenti set
      data = coalesce((p ->> 'data')::date, data),
      durata_min = nullif(p ->> 'durata_min', '')::smallint,
      argomenti = coalesce(array(select jsonb_array_elements_text(p -> 'argomenti')), '{}'),
      titolo = nullif(p ->> 'titolo', ''),
      descrizione = coalesce(p ->> 'descrizione', '')
    where id = a and dojo_id = d;
    if not found then raise exception 'Allenamento non trovato'; end if;
    delete from public.presenze where allenamento_id = a;
  end if;

  insert into public.presenze (allenamento_id, dojo_id, atleta_id)
  select a, d, x::uuid from jsonb_array_elements_text(coalesce(p -> 'presenti', '[]'::jsonb)) as x
  on conflict do nothing;

  return a;
end $$;

revoke all on function public.salva_allenamento(jsonb) from public, anon;
grant execute on function public.salva_allenamento(jsonb) to authenticated;
