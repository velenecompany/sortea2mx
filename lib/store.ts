import { neon } from "@neondatabase/serverless";
import { DEFAULT_CONFIG, Entry, RaffleState } from "./types";

// Antes esto escribía a un archivo JSON local. En Vercel el filesystem de
// una función serverless es de solo lectura fuera de /tmp, así que eso
// truena en producción (por eso el 500 en /api/raffle). Ahora vive en Neon.
//
// Todas las funciones exportadas tienen exactamente la misma firma que
// antes — nada más cambió aquí, ninguna ruta ni componente se toca.

const sql = neon(process.env.DATABASE_URL!);

async function ensureRow(): Promise<RaffleState> {
  const rows = await sql`select config, entries from raffle_state where id = 1`;

  if (rows.length === 0) {
    await sql`
      insert into raffle_state (id, config, entries)
      values (1, ${JSON.stringify(DEFAULT_CONFIG)}::jsonb, '[]'::jsonb)
      on conflict (id) do nothing
    `;
    return { config: DEFAULT_CONFIG, entries: [] };
  }

  const row = rows[0] as { config: RaffleState["config"]; entries: Entry[] };
  return { config: row.config, entries: row.entries };
}

async function writeState(state: RaffleState) {
  await sql`
    update raffle_state
    set config = ${JSON.stringify(state.config)}::jsonb,
        entries = ${JSON.stringify(state.entries)}::jsonb
    where id = 1
  `;
}

export async function getState(): Promise<RaffleState> {
  return ensureRow();
}

export async function joinEntry(name: string): Promise<RaffleState> {
  const state = await ensureRow();
  if (state.config.status === "drawn") return state;

  const trimmed = name.trim();
  if (!trimmed) return state;

  const entry: Entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed,
    number: state.entries.length + 1,
    source: "manual",
    ts: Date.now(),
  };
  state.entries.push(entry);
  await writeState(state);
  return state;
}

export async function importInstagram(names: string[]): Promise<RaffleState> {
  const state = await ensureRow();
  const existing = new Set(state.entries.map((e) => e.name.toLowerCase()));

  for (const raw of names) {
    const name = raw.trim();
    if (!name || existing.has(name.toLowerCase())) continue;
    state.entries.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      number: state.entries.length + 1,
      source: "instagram",
      ts: Date.now(),
    });
    existing.add(name.toLowerCase());
  }

  await writeState(state);
  return state;
}

export async function removeEntry(id: string): Promise<RaffleState> {
  const state = await ensureRow();
  state.entries = state.entries.filter((e) => e.id !== id);
  state.entries.forEach((e, i) => (e.number = i + 1));
  await writeState(state);
  return state;
}

export async function saveConfig(
  partial: Partial<RaffleState["config"]>
): Promise<RaffleState> {
  const state = await ensureRow();
  state.config = { ...state.config, ...partial };
  await writeState(state);
  return state;
}

export async function setForcedWinner(entryId: string | null): Promise<RaffleState> {
  const state = await ensureRow();
  state.config.forcedWinnerId = entryId;
  await writeState(state);
  return state;
}

export async function drawWinner(): Promise<{ state: RaffleState; winner: Entry | null }> {
  const state = await ensureRow();
  if (state.entries.length === 0 || state.config.status === "drawn") {
    return { state, winner: null };
  }

  const forced = state.entries.find((e) => e.id === state.config.forcedWinnerId);
  const winner = forced ?? state.entries[Math.floor(Math.random() * state.entries.length)];

  state.config.status = "drawn";
  state.config.winnerEntryId = winner.id;
  await writeState(state);

  return { state, winner };
}

export async function resetRaffle(): Promise<RaffleState> {
  const state = await ensureRow();
  state.entries = [];
  state.config.status = "open";
  state.config.winnerEntryId = null;
  state.config.forcedWinnerId = null;
  await writeState(state);
  return state;
}
