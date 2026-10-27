-- =====================================================================
-- Registro Dojo · schema iniziale
-- Esegui questo file una volta nel SQL Editor di Supabase.
-- Le modifiche successive vanno in nuovi file 0002_..., 0003_... :
-- non modificare un file già eseguito.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipi
-- ---------------------------------------------------------------------
create type public.ruolo as enum ('admin', 'istruttore', 'atleta');

-- ---------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------

-- Una società / palestra. Tutti i dati appartengono a un dojo.
create table public.dojos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (length(trim(nome)) > 0),
  created_at  timestamptz not null default now()
);

-- Dati pubblici dell'utente (nome visualizzato). Creato in automatico alla registrazione.
create table public.profili (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text,
  created_at  timestamptz not null default now()
);

create table public.atleti (
  id            uuid primary key default gen_random_uuid(),
  dojo_id       uuid not null references public.dojos (id) on delete cascade,
  nome          text not null check (length(trim(nome)) > 0),
  sesso         char(1) not null check (sesso in ('M', 'F')),
  anno_nascita  int check (anno_nascita between 1920 and 2100),
  cintura       smallint not null default 0 check (cintura between 0 and 10),
  note          text,
  archiviato    boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (id, dojo_id)
);
create index on public.atleti (dojo_id);

-- Chi può entrare in un dojo e con quale ruolo.
-- Un utente con ruolo 'atleta' è collegato alla sua scheda atleta.
create table public.membri (
  dojo_id     uuid not null references public.dojos (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  ruolo       public.ruolo not null,
  atleta_id   uuid,
  created_at  timestamptz not null default now(),
  primary key (dojo_id, user_id),
  foreign key (atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete cascade,
  check (ruolo <> 'atleta' or atleta_id is not null)
);
create index on public.membri (user_id);
create unique index membri_un_utente_per_atleta on public.membri (atleta_id) where atleta_id is not null;

-- Misure mensili. "valori" contiene le misure come chiave → numero
-- (es. {"peso": 63.4, "vita": 74}); l'elenco delle misure è in
-- src/lib/domain/misure.ts, così aggiungerne una non richiede migrazioni.
create table public.misure (
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
create index on public.misure (dojo_id, mese);

-- Un incontro di kumite. Ogni lato può essere un atleta del dojo o un esterno (solo nome).
create table public.incontri (
  id             uuid primary key default gen_random_uuid(),
  dojo_id        uuid not null references public.dojos (id) on delete cascade,
  data           date not null default current_date,
  tipo           text not null default 'allenamento' check (tipo in ('allenamento', 'gara')),
  aka_atleta_id  uuid,
  aka_nome       text not null,
  ao_atleta_id   uuid,
  ao_nome        text not null,
  note           text,
  created_by     uuid default auth.uid(),
  created_at     timestamptz not null default now(),
  unique (id, dojo_id),
  foreign key (aka_atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete set null (aka_atleta_id),
  foreign key (ao_atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete set null (ao_atleta_id),
  check (aka_atleta_id is null or ao_atleta_id is null or aka_atleta_id <> ao_atleta_id)
);
create index on public.incontri (dojo_id, data desc);
create index on public.incontri (aka_atleta_id);
create index on public.incontri (ao_atleta_id);

-- Ogni punto segnato in un incontro.
create table public.punti (
  id           uuid primary key default gen_random_uuid(),
  incontro_id  uuid not null,
  dojo_id      uuid not null,
  ordine       smallint not null,
  lato         text not null check (lato in ('aka', 'ao')),       -- chi ha segnato
  tecnica      text not null,                                      -- chiave in src/lib/domain/kumite.ts
  zona         text not null check (zona in ('jodan', 'chudan', 'terra')),
  parte        text not null default 'c' check (parte in ('sx', 'c', 'dx')),  -- lato del corpo di chi subisce
  situazione   text not null check (situazione in ('attacco', 'contrattacco', 'anticipo')),
  valore       smallint not null check (valore between 1 and 3),
  foreign key (incontro_id, dojo_id) references public.incontri (id, dojo_id) on delete cascade,
  unique (incontro_id, ordine)
);

-- Codici invito per istruttori e atleti.
create or replace function public.genera_codice() returns text
language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 32), 1), '')
  from (select gen_random_bytes(8) as b) r, generate_series(0, 7) i
$$;

create table public.inviti (
  codice      text primary key default public.genera_codice(),
  dojo_id     uuid not null references public.dojos (id) on delete cascade,
  ruolo       public.ruolo not null,
  atleta_id   uuid,
  creato_da   uuid default auth.uid(),
  usato_da    uuid references auth.users (id) on delete set null,
  usato_il    timestamptz,
  scade_il    timestamptz not null default now() + interval '14 days',
  created_at  timestamptz not null default now(),
  foreign key (atleta_id, dojo_id) references public.atleti (id, dojo_id) on delete cascade,
  check (ruolo = 'atleta' and atleta_id is not null or ruolo <> 'atleta' and atleta_id is null)
);
create index on public.inviti (dojo_id);

-- ---------------------------------------------------------------------
-- Funzioni di supporto per i permessi
-- (security definer: leggono "membri" senza ricadere nelle sue regole)
-- ---------------------------------------------------------------------
create or replace function public.mio_ruolo(d uuid) returns public.ruolo
language sql stable security definer set search_path = public as $$
  select ruolo from public.membri where dojo_id = d and user_id = auth.uid()
$$;

create or replace function public.is_staff(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.mio_ruolo(d) in ('admin', 'istruttore'), false)
$$;

create or replace function public.is_admin(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.mio_ruolo(d) = 'admin', false)
$$;

create or replace function public.mio_atleta(d uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select atleta_id from public.membri where dojo_id = d and user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- Regole di accesso (Row Level Security)
--   staff (admin, istruttore): legge e scrive tutto il proprio dojo
--   atleta: legge solo la propria scheda, le proprie misure e i propri incontri
-- ---------------------------------------------------------------------
alter table public.dojos    enable row level security;
alter table public.profili  enable row level security;
alter table public.membri   enable row level security;
alter table public.atleti   enable row level security;
alter table public.misure   enable row level security;
alter table public.incontri enable row level security;
alter table public.punti    enable row level security;
alter table public.inviti   enable row level security;

create policy dojos_leggi on public.dojos for select using (public.mio_ruolo(id) is not null);
create policy dojos_modifica on public.dojos for update using (public.is_admin(id)) with check (public.is_admin(id));

create policy profili_leggi on public.profili for select using (
  id = auth.uid()
  or exists (select 1 from public.membri m where m.user_id = profili.id and public.is_staff(m.dojo_id))
);
create policy profili_modifica on public.profili for update using (id = auth.uid()) with check (id = auth.uid());

create policy membri_leggi on public.membri for select using (user_id = auth.uid() or public.is_staff(dojo_id));
create policy membri_modifica on public.membri for update using (public.is_admin(dojo_id) and user_id <> auth.uid()) with check (public.is_admin(dojo_id));
create policy membri_elimina on public.membri for delete using (public.is_admin(dojo_id) and user_id <> auth.uid());

create policy atleti_leggi on public.atleti for select using (public.is_staff(dojo_id) or id = public.mio_atleta(dojo_id));
create policy atleti_inserisci on public.atleti for insert with check (public.is_staff(dojo_id));
create policy atleti_modifica on public.atleti for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy atleti_elimina on public.atleti for delete using (public.is_staff(dojo_id));

create policy misure_leggi on public.misure for select using (public.is_staff(dojo_id) or atleta_id = public.mio_atleta(dojo_id));
create policy misure_inserisci on public.misure for insert with check (public.is_staff(dojo_id));
create policy misure_modifica on public.misure for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy misure_elimina on public.misure for delete using (public.is_staff(dojo_id));

create policy incontri_leggi on public.incontri for select using (
  public.is_staff(dojo_id) or public.mio_atleta(dojo_id) in (aka_atleta_id, ao_atleta_id)
);
create policy incontri_inserisci on public.incontri for insert with check (public.is_staff(dojo_id));
create policy incontri_modifica on public.incontri for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy incontri_elimina on public.incontri for delete using (public.is_staff(dojo_id));

create policy punti_leggi on public.punti for select using (
  public.is_staff(dojo_id)
  or exists (select 1 from public.incontri i where i.id = punti.incontro_id
             and public.mio_atleta(i.dojo_id) in (i.aka_atleta_id, i.ao_atleta_id))
);
create policy punti_inserisci on public.punti for insert with check (public.is_staff(dojo_id));
create policy punti_modifica on public.punti for update using (public.is_staff(dojo_id)) with check (public.is_staff(dojo_id));
create policy punti_elimina on public.punti for delete using (public.is_staff(dojo_id));

-- Gli istruttori invitano atleti; solo l'admin invita altri istruttori o admin.
create policy inviti_leggi on public.inviti for select using (public.is_staff(dojo_id));
create policy inviti_inserisci on public.inviti for insert with check (
  public.is_staff(dojo_id) and (ruolo = 'atleta' or public.is_admin(dojo_id))
);
create policy inviti_elimina on public.inviti for delete using (public.is_staff(dojo_id));

-- ---------------------------------------------------------------------
-- Profilo creato in automatico alla registrazione
-- ---------------------------------------------------------------------
create or replace function public.nuovo_utente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profili (id, nome) values (new.id, new.raw_user_meta_data ->> 'nome');
  return new;
end $$;

create trigger su_nuovo_utente after insert on auth.users
  for each row execute function public.nuovo_utente();

create or replace function public.tocca_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

create trigger misure_updated_at before update on public.misure
  for each row execute function public.tocca_updated_at();

-- ---------------------------------------------------------------------
-- Azioni chiamate dall'app (RPC)
-- ---------------------------------------------------------------------

-- Crea un dojo e rende admin chi lo crea.
create or replace function public.crea_dojo(p_nome text) returns uuid
language plpgsql security definer set search_path = public as $$
declare d uuid;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto'; end if;
  insert into public.dojos (nome) values (trim(p_nome)) returning id into d;
  insert into public.membri (dojo_id, user_id, ruolo) values (d, auth.uid(), 'admin');
  return d;
end $$;

-- Usa un codice invito: aggiunge l'utente al dojo con il ruolo indicato.
create or replace function public.accetta_invito(p_codice text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv public.inviti;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto'; end if;
  select * into inv from public.inviti
    where codice = upper(trim(p_codice)) and usato_da is null and scade_il > now()
    for update;
  if not found then raise exception 'Codice non valido, già usato o scaduto'; end if;
  if inv.atleta_id is not null and exists (
    select 1 from public.membri where atleta_id = inv.atleta_id and user_id <> auth.uid()
  ) then raise exception 'Questa scheda atleta è già collegata a un altro account'; end if;

  insert into public.membri (dojo_id, user_id, ruolo, atleta_id)
    values (inv.dojo_id, auth.uid(), inv.ruolo, inv.atleta_id)
    on conflict (dojo_id, user_id) do update set ruolo = excluded.ruolo, atleta_id = excluded.atleta_id;
  update public.inviti set usato_da = auth.uid(), usato_il = now() where codice = inv.codice;
  return inv.dojo_id;
end $$;

-- Salva un incontro con tutti i suoi punti in un'unica operazione.
-- Rispetta i permessi di chi chiama (security invoker).
create or replace function public.salva_incontro(p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare i uuid;
begin
  insert into public.incontri (dojo_id, data, tipo, aka_atleta_id, aka_nome, ao_atleta_id, ao_nome, note)
  values (
    (p ->> 'dojo_id')::uuid,
    coalesce((p ->> 'data')::date, current_date),
    coalesce(p ->> 'tipo', 'allenamento'),
    nullif(p ->> 'aka_atleta_id', '')::uuid, p ->> 'aka_nome',
    nullif(p ->> 'ao_atleta_id', '')::uuid,  p ->> 'ao_nome',
    p ->> 'note'
  ) returning id into i;

  insert into public.punti (incontro_id, dojo_id, ordine, lato, tecnica, zona, parte, situazione, valore)
  select i, (p ->> 'dojo_id')::uuid, (x.ordinalita - 1)::smallint,
         x.e ->> 'lato', x.e ->> 'tecnica', x.e ->> 'zona', coalesce(x.e ->> 'parte', 'c'),
         x.e ->> 'situazione', (x.e ->> 'valore')::smallint
  from jsonb_array_elements(coalesce(p -> 'punti', '[]'::jsonb)) with ordinality as x(e, ordinalita);

  return i;
end $$;

revoke all on function public.crea_dojo(text), public.accetta_invito(text), public.salva_incontro(jsonb) from public, anon;
grant execute on function public.crea_dojo(text), public.accetta_invito(text), public.salva_incontro(jsonb) to authenticated;
