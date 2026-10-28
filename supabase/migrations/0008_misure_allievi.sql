-- =====================================================================
-- FurinkazApp · 0008 gli allievi inseriscono le proprie misure
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0007.
--
-- Staff: come prima, inserisce e modifica le misure di tutti.
-- Allievo e Allievo+: inseriscono e correggono solo le misure della propria scheda.
-- Eliminare resta riservato allo staff. Le valutazioni non cambiano.
-- =====================================================================

drop policy if exists misure_inserisci on public.misure;
create policy misure_inserisci on public.misure for insert
  with check (public.is_staff(dojo_id) or atleta_id = public.mio_atleta(dojo_id));

drop policy if exists misure_modifica on public.misure;
create policy misure_modifica on public.misure for update
  using (public.is_staff(dojo_id) or atleta_id = public.mio_atleta(dojo_id))
  with check (public.is_staff(dojo_id) or atleta_id = public.mio_atleta(dojo_id));
