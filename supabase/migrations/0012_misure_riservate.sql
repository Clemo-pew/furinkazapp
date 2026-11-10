-- =====================================================================
-- FurinkazApp · 0012 misure riservate
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0011.
--
-- Peso, massa grassa e circonferenze possono essere dati relativi alla salute:
-- da ora le misure di un atleta le leggono solo lo staff e l'atleta stesso
-- (come il certificato medico). Inserimento e modifica non cambiano.
-- =====================================================================

drop policy if exists misure_leggi on public.misure;
create policy misure_leggi on public.misure for select
  using (public.is_staff(dojo_id) or atleta_id = public.mio_atleta(dojo_id));

-- ---------------------------------------------------------------------
-- Note dell'allenatore sull'atleta (possono contenere infortuni):
-- spostate dalla scheda atleta, che tutto il dojo legge, a una tabella riservata allo staff.
-- ---------------------------------------------------------------------
create table if not exists public.note_atleti (
  atleta_id   uuid primary key,
  dojo_id     uuid not null,
  note        text not null,
  updated_at  timestamptz not null default now(),
  foreign key (atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete cascade
);

alter table public.note_atleti enable row level security;
create policy note_leggi on public.note_atleti for select using (public.is_staff(dojo_id));
create policy note_inserisci on public.note_atleti for insert with check (public.is_staff(dojo_id));
create policy note_modifica on public.note_atleti for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy note_elimina on public.note_atleti for delete using (public.is_staff(dojo_id));

insert into public.note_atleti (atleta_id, dojo_id, note)
  select id, dojo_id, note from public.atleti where note is not null and length(trim(note)) > 0
  on conflict (atleta_id) do nothing;
update public.atleti set note = null where note is not null;
