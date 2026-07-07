-- Corre esto en el SQL Editor de Neon. Es seguro correrlo aunque ya hayas
-- corrido la migración anterior (todo usa IF NOT EXISTS / ON CONFLICT).

create table if not exists raffles (
  slug text primary key,
  title text not null,
  prize text not null,
  description text not null,
  mode text not null default 'directo',
  draw_at timestamptz,
  status text not null default 'open',
  winner_entry_id text,
  forced_winner_id text,
  created_at timestamptz not null default now()
);

create table if not exists raffle_entries (
  id text primary key,
  raffle_slug text not null references raffles(slug) on delete cascade,
  name text not null,
  number integer not null,
  source text not null default 'manual',
  ts bigint not null
);

create index if not exists raffle_entries_slug_idx on raffle_entries(raffle_slug);

-- Si tenías el sorteo viejo (tabla raffle_state, de un solo sorteo), lo
-- migra automáticamente a la tabla nueva bajo el slug 'rifa-sortea2mx',
-- para que no pierdas los participantes que ya habías juntado.
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'raffle_state') then
    insert into raffles (slug, title, prize, description, mode, draw_at, status, winner_entry_id, forced_winner_id)
    select
      'rifa-sortea2mx',
      config->>'title',
      config->>'prize',
      config->>'description',
      config->>'mode',
      nullif(config->>'drawAt','')::timestamptz,
      config->>'status',
      config->>'winnerEntryId',
      config->>'forcedWinnerId'
    from raffle_state
    where id = 1
    on conflict (slug) do nothing;

    insert into raffle_entries (id, raffle_slug, name, number, source, ts)
    select
      e->>'id',
      'rifa-sortea2mx',
      e->>'name',
      (e->>'number')::integer,
      e->>'source',
      (e->>'ts')::bigint
    from raffle_state, jsonb_array_elements(entries) as e
    where id = 1
    on conflict (id) do nothing;
  end if;
end $$;
