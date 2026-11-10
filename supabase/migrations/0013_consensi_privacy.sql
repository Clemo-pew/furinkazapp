-- =====================================================================
-- FurinkazApp · 0013 accettazione dell'informativa e consensi
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0012.
--
-- Ogni utente, al primo accesso dopo una nuova versione dell'informativa,
-- conferma di averla letta; chi ha una scheda atleta sceglie se dare il consenso
-- ai dati sulla salute (misure, scadenza del certificato). Per i minori accetta il genitore.
-- =====================================================================

create table public.consensi_privacy (
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dojo_id          uuid not null references public.dojos (id) on delete cascade,
  -- versione dell'informativa accettata (PRIVACY_VERSIONE in src/lib/privacy.ts)
  versione         text not null check (length(versione) between 1 and 40),
  letto            boolean not null check (letto),
  consenso_salute  boolean not null default false,
  accettato_da     text not null check (accettato_da in ('interessato', 'genitore')),
  nome_genitore    text check (accettato_da = 'interessato' or length(trim(coalesce(nome_genitore, ''))) > 1),
  accettato_il     timestamptz not null default now(),
  primary key (user_id, dojo_id, versione)
);

alter table public.consensi_privacy enable row level security;

-- Ognuno registra e aggiorna solo i propri consensi; lo staff del dojo li legge.
create policy consensi_leggi on public.consensi_privacy for select
  using (user_id = auth.uid() or public.is_staff(dojo_id));
create policy consensi_inserisci on public.consensi_privacy for insert
  with check (user_id = auth.uid() and public.is_membro(dojo_id));
create policy consensi_modifica on public.consensi_privacy for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_membro(dojo_id));
