-- =====================================================================
-- FurinkazApp · 0003 gli atleti vedono tutta la squadra
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0002.
--
-- Prima: un atleta leggeva solo la propria scheda.
-- Ora: chiunque faccia parte del dojo legge atleti, misure, valutazioni
-- e incontri del dojo. Scrivere resta riservato ad amministratori e istruttori.
-- =====================================================================

create or replace function public.is_membro(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.mio_ruolo(d) is not null
$$;

drop policy if exists atleti_leggi on public.atleti;
create policy atleti_leggi on public.atleti for select using (public.is_membro(dojo_id));

drop policy if exists misure_leggi on public.misure;
create policy misure_leggi on public.misure for select using (public.is_membro(dojo_id));

drop policy if exists valutazioni_leggi on public.valutazioni;
create policy valutazioni_leggi on public.valutazioni for select using (public.is_membro(dojo_id));

drop policy if exists incontri_leggi on public.incontri;
create policy incontri_leggi on public.incontri for select using (public.is_membro(dojo_id));

drop policy if exists punti_leggi on public.punti;
create policy punti_leggi on public.punti for select using (public.is_membro(dojo_id));
