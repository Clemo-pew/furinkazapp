-- =====================================================================
-- FurinkazApp · 0005 kata
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0004.
-- =====================================================================

-- Kata conosciuti da ogni atleta. "kata" è una chiave dell'elenco in src/lib/domain/kata.ts
-- (es. "heian_shodan"), così l'elenco si può ampliare senza toccare il database.
create table public.kata_conosciuti (
  atleta_id   uuid not null,
  dojo_id     uuid not null,
  kata        text not null check (kata ~ '^[a-z0-9_]{2,40}$'),
  dal         date,
  created_at  timestamptz not null default now(),
  primary key (atleta_id, kata),
  foreign key (atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete cascade
);
create index on public.kata_conosciuti (dojo_id);

alter table public.kata_conosciuti enable row level security;

create policy kata_leggi on public.kata_conosciuti for select using (public.is_membro(dojo_id));
create policy kata_inserisci on public.kata_conosciuti for insert with check (public.is_staff(dojo_id));
create policy kata_modifica on public.kata_conosciuti for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy kata_elimina on public.kata_conosciuti for delete using (public.is_staff(dojo_id));

-- Voto mensile su ogni kata, nella stessa valutazione del mese: {"heian_shodan": 7.5, "tekki_shodan": 6}.
alter table public.valutazioni
  add column kata jsonb not null default '{}'::jsonb check (jsonb_typeof(kata) = 'object');
