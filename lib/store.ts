import { neon } from "@neondatabase/serverless";
import { Entry, NewRaffleInput, RaffleConfig, RaffleState, RaffleSummary, User } from "./types";

// Cliente perezoso: se crea solo la primera vez que se usa, no al importar
// el archivo (si se crea al importar, Next.js truena el build si la env var
// no está disponible en ese momento, aunque nunca se llegue a usar).
let _sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL no está configurada. Revisa las Environment Variables en Vercel (o tu .env.local en desarrollo)."
      );
    }
    _sql = neon(url);
  }
  return _sql;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "sorteo"}-${suffix}`;
}

type RaffleRow = {
  slug: string;
  title: string;
  prize: string;
  description: string;
  mode: string;
  draw_at: string | null;
  status: string;
  winner_entry_id: string | null;
  forced_winner_id: string | null;
  created_at: string;
  user_id: string | null;
};

type EntryRow = {
  id: string;
  name: string;
  number: number;
  source: string;
  ts: string; // bigint vuelve como string en el driver
};

function rowToConfig(row: RaffleRow): RaffleConfig {
  return {
    slug: row.slug,
    title: row.title,
    prize: row.prize,
    description: row.description,
    mode: row.mode as RaffleConfig["mode"],
    drawAt: row.draw_at,
    status: row.status as RaffleConfig["status"],
    winnerEntryId: row.winner_entry_id,
    forcedWinnerId: row.forced_winner_id,
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    source: row.source as Entry["source"],
    ts: Number(row.ts),
  };
}

export async function listRaffles(): Promise<RaffleSummary[]> {
  const sql = getSql();
  const rows = (await sql`
    select r.slug, r.title, r.prize, r.status, r.created_at,
           count(e.id)::int as entry_count
    from raffles r
    left join raffle_entries e on e.raffle_slug = r.slug
    group by r.slug, r.title, r.prize, r.status, r.created_at
    order by r.created_at desc
  `) as { slug: string; title: string; prize: string; status: string; created_at: string; entry_count: number }[];

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    prize: r.prize,
    status: r.status as RaffleSummary["status"],
    entryCount: r.entry_count,
    createdAt: r.created_at,
  }));
}

export async function createRaffle(input: NewRaffleInput, userId: string | null = null): Promise<RaffleConfig> {
  const sql = getSql();
  const slug = slugify(input.title);

  const rows = (await sql`
    insert into raffles (slug, title, prize, description, mode, user_id)
    values (${slug}, ${input.title}, ${input.prize}, ${input.description}, ${input.mode}, ${userId})
    returning *
  `) as RaffleRow[];

  return rowToConfig(rows[0]);
}

export async function deleteRaffle(slug: string): Promise<void> {
  const sql = getSql();
  await sql`delete from raffles where slug = ${slug}`;
}

export async function getState(slug: string): Promise<RaffleState | null> {
  const sql = getSql();
  const raffleRows = (await sql`select * from raffles where slug = ${slug}`) as RaffleRow[];
  if (raffleRows.length === 0) return null;

  const entryRows = (await sql`
    select id, name, number, source, ts from raffle_entries
    where raffle_slug = ${slug}
    order by number asc
  `) as EntryRow[];

  return {
    config: rowToConfig(raffleRows[0]),
    entries: entryRows.map(rowToEntry),
  };
}

export async function joinEntry(slug: string, name: string): Promise<RaffleState | null> {
  const sql = getSql();
  const state = await getState(slug);
  if (!state || state.config.status === "drawn") return state;

  const trimmed = name.trim();
  if (!trimmed) return state;

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const number = state.entries.length + 1;

  await sql`
    insert into raffle_entries (id, raffle_slug, name, number, source, ts)
    values (${id}, ${slug}, ${trimmed}, ${number}, 'manual', ${Date.now()})
  `;

  return getState(slug);
}

export async function importInstagram(slug: string, names: string[]): Promise<RaffleState | null> {
  const sql = getSql();
  const state = await getState(slug);
  if (!state) return null;

  const existing = new Set(state.entries.map((e) => e.name.toLowerCase()));
  let next = state.entries.length + 1;

  for (const raw of names) {
    const name = raw.trim();
    if (!name || existing.has(name.toLowerCase())) continue;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await sql`
      insert into raffle_entries (id, raffle_slug, name, number, source, ts)
      values (${id}, ${slug}, ${name}, ${next}, 'instagram', ${Date.now()})
    `;
    existing.add(name.toLowerCase());
    next++;
  }

  return getState(slug);
}

export async function removeEntry(slug: string, id: string): Promise<RaffleState | null> {
  const sql = getSql();
  await sql`delete from raffle_entries where id = ${id} and raffle_slug = ${slug}`;

  // renumerar para no dejar huecos
  const rows = (await sql`
    select id from raffle_entries where raffle_slug = ${slug} order by number asc
  `) as { id: string }[];

  for (let i = 0; i < rows.length; i++) {
    await sql`update raffle_entries set number = ${i + 1} where id = ${rows[i].id}`;
  }

  return getState(slug);
}

export async function saveConfig(
  slug: string,
  partial: Partial<Pick<RaffleConfig, "title" | "prize" | "description" | "mode" | "drawAt">>
): Promise<RaffleState | null> {
  const sql = getSql();
  const current = await getState(slug);
  if (!current) return null;

  const next = { ...current.config, ...partial };

  await sql`
    update raffles
    set title = ${next.title},
        prize = ${next.prize},
        description = ${next.description},
        mode = ${next.mode},
        draw_at = ${next.drawAt}
    where slug = ${slug}
  `;

  return getState(slug);
}

export async function setForcedWinner(slug: string, entryId: string | null): Promise<RaffleState | null> {
  const sql = getSql();
  await sql`update raffles set forced_winner_id = ${entryId} where slug = ${slug}`;
  return getState(slug);
}

export async function drawWinner(
  slug: string
): Promise<{ state: RaffleState | null; winner: Entry | null }> {
  const state = await getState(slug);
  if (!state || state.entries.length === 0 || state.config.status === "drawn") {
    return { state, winner: null };
  }

  const sql = getSql();
  const forced = state.entries.find((e) => e.id === state.config.forcedWinnerId);
  const winner = forced ?? state.entries[Math.floor(Math.random() * state.entries.length)];

  await sql`
    update raffles set status = 'drawn', winner_entry_id = ${winner.id} where slug = ${slug}
  `;

  const updated = await getState(slug);
  return { state: updated, winner };
}

export async function resetRaffle(slug: string): Promise<RaffleState | null> {
  const sql = getSql();
  await sql`delete from raffle_entries where raffle_slug = ${slug}`;
  await sql`
    update raffles
    set status = 'open', winner_entry_id = null, forced_winner_id = null
    where slug = ${slug}
  `;
  return getState(slug);
}

// ---------- Usuarios (cuentas de creador, separadas del PIN de /ceo) ----------

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const sql = getSql();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await sql`insert into users (id, email, password_hash) values (${id}, ${email.toLowerCase()}, ${passwordHash})`;
  return { id, email: email.toLowerCase() };
}

export async function getUserByEmail(
  email: string
): Promise<{ id: string; email: string; passwordHash: string } | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, email, password_hash from users where email = ${email.toLowerCase()}
  `) as { id: string; email: string; password_hash: string }[];
  if (rows.length === 0) return null;
  return { id: rows[0].id, email: rows[0].email, passwordHash: rows[0].password_hash };
}

export async function getUserById(id: string): Promise<User | null> {
  const sql = getSql();
  const rows = (await sql`select id, email from users where id = ${id}`) as User[];
  return rows.length > 0 ? rows[0] : null;
}

export async function listRafflesByUser(userId: string): Promise<RaffleSummary[]> {
  const sql = getSql();
  const rows = (await sql`
    select r.slug, r.title, r.prize, r.status, r.created_at,
           count(e.id)::int as entry_count
    from raffles r
    left join raffle_entries e on e.raffle_slug = r.slug
    where r.user_id = ${userId}
    group by r.slug, r.title, r.prize, r.status, r.created_at
    order by r.created_at desc
  `) as { slug: string; title: string; prize: string; status: string; created_at: string; entry_count: number }[];

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    prize: r.prize,
    status: r.status as RaffleSummary["status"],
    entryCount: r.entry_count,
    createdAt: r.created_at,
  }));
}

export async function isOwnedBy(slug: string, userId: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`select user_id from raffles where slug = ${slug}`) as { user_id: string | null }[];
  return rows.length > 0 && rows[0].user_id === userId;
}
