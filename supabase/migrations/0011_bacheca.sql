-- =====================================================================
-- FurinkazApp · 0011 bacheca delle comunicazioni
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0010.
-- =====================================================================

create table public.comunicazioni (
  id           uuid primary key default gen_random_uuid(),
  dojo_id      uuid not null references public.dojos (id) on delete cascade,
  titolo       text not null check (length(trim(titolo)) > 0),
  testo        text not null default '',
  -- fissata in cima alla bacheca e nella home
  in_evidenza  boolean not null default false,
  -- dopo questa data non compare più nella home (resta in bacheca, tra le passate)
  scade_il     date,
  -- nome di chi l'ha scritta, salvato al momento della pubblicazione
  autore_nome  text,
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.comunicazioni (dojo_id, created_at desc);

alter table public.comunicazioni enable row level security;

-- Tutto il dojo legge; pubblicano, modificano ed eliminano amministratori e istruttori.
create policy comunicazioni_leggi on public.comunicazioni for select using (public.is_membro(dojo_id));
create policy comunicazioni_inserisci on public.comunicazioni for insert with check (public.is_staff(dojo_id));
create policy comunicazioni_modifica on public.comunicazioni for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy comunicazioni_elimina on public.comunicazioni for delete using (public.is_staff(dojo_id));

create trigger comunicazioni_updated_at before update on public.comunicazioni
  for each row execute function public.tocca_updated_at();
