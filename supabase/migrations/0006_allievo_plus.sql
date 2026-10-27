-- =====================================================================
-- FurinkazApp · 0006 ruoli Allievo e Allievo+
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0005.
--
--   atleta       = "Allievo":  vede squadra, kumite, diario e kata conosciuti, ma NESSUN voto
--   atleta_plus  = "Allievo+": come Allievo, e in più vede le valutazioni (proprie e degli altri)
--
-- Gli account già esistenti con ruolo atleta diventano "Allievo": da questo momento non vedono
-- le valutazioni finché l'amministratore non li passa ad "Allievo+".
-- (Il nuovo valore si confronta come testo: Postgres non permette di usarlo nello stesso script
-- in cui viene creato.)
-- =====================================================================

alter type public.ruolo add value if not exists 'atleta_plus';

-- Un account di allievo (con o senza +) deve essere collegato a una scheda atleta.
alter table public.membri drop constraint if exists membri_check;
alter table public.membri add constraint membri_scheda_allievo
  check (ruolo::text not in ('atleta', 'atleta_plus') or atleta_id is not null);

alter table public.inviti drop constraint if exists inviti_check;
alter table public.inviti add constraint inviti_scheda_allievo
  check ((ruolo::text in ('atleta', 'atleta_plus')) = (atleta_id is not null));

-- Chi può vedere i voti: staff e Allievo+.
create or replace function public.vede_valutazioni(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.mio_ruolo(d)::text in ('admin', 'istruttore', 'atleta_plus'), false)
$$;

drop policy if exists valutazioni_leggi on public.valutazioni;
create policy valutazioni_leggi on public.valutazioni for select using (public.vede_valutazioni(dojo_id));
