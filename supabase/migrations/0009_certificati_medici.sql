-- =====================================================================
-- FurinkazApp · 0009 certificato medico
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0008.
--
-- È un dato sanitario: sta in una tabella a parte, che leggono solo lo staff
-- e l'atleta a cui appartiene (gli altri allievi non lo vedono). Scrive solo lo staff.
-- =====================================================================

create table public.certificati_medici (
  atleta_id   uuid primary key,
  dojo_id     uuid not null,
  tipo        text not null check (tipo in ('agonistico', 'non_agonistico')),
  scadenza    date not null,
  updated_at  timestamptz not null default now(),
  foreign key (atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete cascade
);
create index on public.certificati_medici (dojo_id, scadenza);

alter table public.certificati_medici enable row level security;

create policy certificati_leggi on public.certificati_medici for select
  using (public.is_staff(dojo_id) or atleta_id = public.mio_atleta(dojo_id));
create policy certificati_inserisci on public.certificati_medici for insert with check (public.is_staff(dojo_id));
create policy certificati_modifica on public.certificati_medici for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy certificati_elimina on public.certificati_medici for delete using (public.is_staff(dojo_id));

create trigger certificati_updated_at before update on public.certificati_medici
  for each row execute function public.tocca_updated_at();
