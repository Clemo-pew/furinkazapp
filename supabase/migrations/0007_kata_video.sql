-- =====================================================================
-- FurinkazApp · 0007 video dei kata
-- Esegui questo file una volta nel SQL Editor di Supabase, dopo 0006.
-- =====================================================================

-- Video scelto dal dojo per un kata (sostituisce quello predefinito in src/lib/domain/kataVideo.ts).
create table public.kata_video (
  dojo_id     uuid not null references public.dojos (id) on delete cascade,
  kata        text not null check (kata ~ '^[a-z0-9_]{2,40}$'),
  youtube_id  text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  updated_at  timestamptz not null default now(),
  primary key (dojo_id, kata)
);

alter table public.kata_video enable row level security;

create policy kata_video_leggi on public.kata_video for select using (public.is_membro(dojo_id));
create policy kata_video_inserisci on public.kata_video for insert with check (public.is_staff(dojo_id));
create policy kata_video_modifica on public.kata_video for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy kata_video_elimina on public.kata_video for delete using (public.is_staff(dojo_id));
