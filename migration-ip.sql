-- Corre esto en el SQL Editor de Neon.
alter table raffle_entries add column if not exists ip text;
create index if not exists raffle_entries_ip_idx on raffle_entries(raffle_slug, ip);
