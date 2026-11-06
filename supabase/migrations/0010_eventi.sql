-- =====================================================================
-- FurinkazApp · 0010 eventi (gare, stage, esami…)
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0009.
-- =====================================================================

-- "tipo" è una chiave dell'elenco in src/lib/domain/eventi.ts (gara, stage, esame, …).
create table public.eventi (
  id           uuid primary key default gen_random_uuid(),
  dojo_id      uuid not null references public.dojos (id) on delete cascade,
  titolo       text not null check (length(trim(titolo)) > 0),
  tipo         text not null default 'altro' check (tipo ~ '^[a-z_]{2,30}$'),
  data_inizio  date not null,
  data_fine    date,
  ora          text check (ora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  luogo        text,
  descrizione  text,
  link         text check (link is null or link ~* '^https?://'),
  created_by   uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (data_fine is null or data_fine >= data_inizio)
);
create index on public.eventi (dojo_id, data_inizio);

alter table public.eventi enable row level security;

-- Tutto il dojo vede gli eventi; li gestiscono amministratori e istruttori.
create policy eventi_leggi on public.eventi for select using (public.is_membro(dojo_id));
create policy eventi_inserisci on public.eventi for insert with check (public.is_staff(dojo_id));
create policy eventi_modifica on public.eventi for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy eventi_elimina on public.eventi for delete using (public.is_staff(dojo_id));

create trigger eventi_updated_at before update on public.eventi
  for each row execute function public.tocca_updated_at();
