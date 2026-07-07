-- Corre esto en el SQL Editor de Neon (después de migration-multi.sql).

create table if not exists users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table raffles add column if not exists user_id text references users(id) on delete cascade;
