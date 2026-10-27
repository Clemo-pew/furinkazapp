-- =====================================================================
-- FurinkazApp · 0002 valutazioni tecniche
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0001.
-- =====================================================================

-- Valutazioni dell'allenatore, una per atleta per mese.
-- "valori" contiene voce → punteggio (es. {"velocita": 7, "tecnica": 8});
-- l'elenco delle voci e la scala sono in src/lib/domain/valutazioni.ts,
-- così aggiungere una voce non richiede migrazioni.
create table public.valutazioni (
  id          uuid primary key default gen_random_uuid(),
  dojo_id     uuid not null,
  atleta_id   uuid not null,
  mese        date not null check (extract(day from mese) = 1),
  valori      jsonb not null default '{}'::jsonb check (jsonb_typeof(valori) = 'object'),
  note        text,
  created_by  uuid default auth.uid(),
  updated_at  timestamptz not null default now(),
  unique (atleta_id, mese),
  foreign key (atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete cascade
);
create index on public.valutazioni (dojo_id, mese);

alter table public.valutazioni enable row level security;

-- Come le misure: lo staff legge e scrive, l'atleta legge solo le proprie.
create policy valutazioni_leggi on public.valutazioni for select using (public.is_staff(dojo_id) or atleta_id = public.mio_atleta(dojo_id));
create policy valutazioni_inserisci on public.valutazioni for insert with check (public.is_staff(dojo_id));
create policy valutazioni_modifica on public.valutazioni for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy valutazioni_elimina on public.valutazioni for delete using (public.is_staff(dojo_id));

create trigger valutazioni_updated_at before update on public.valutazioni
  for each row execute function public.tocca_updated_at();
