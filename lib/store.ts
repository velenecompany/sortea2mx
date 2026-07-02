import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_CONFIG, Entry, RaffleState } from "./types";

// Almacenamiento simple en un archivo JSON local.
//
// OJO: esto sirve perfecto en tu máquina (npm run dev), pero en Vercel el
// filesystem de una función serverless es de solo lectura fuera de /tmp y no
// se comparte entre invocaciones. Para producción real, este archivo es el
// único que hay que cambiar: mismas funciones (getState, joinEntry, etc.),
// pero leyendo/escribiendo en Neon en vez de en disco. Como ya usas Neon en
// tus otros proyectos, es un swap directo cuando quieras llevarlo a prod.

const DATA_FILE = path.join(process.cwd(), "data", "raffle-data.json");

async function ensureFile(): Promise<RaffleState> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as RaffleState;
  } catch {
    const initial: RaffleState = { config: DEFAULT_CONFIG, entries: [] };
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function writeState(state: RaffleState) {
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2));
}

export async function getState(): Promise<RaffleState> {
  return ensureFile();
}

export async function joinEntry(name: string): Promise<RaffleState> {
  const state = await ensureFile();
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
  const state = await ensureFile();
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
  const state = await ensureFile();
  state.entries = state.entries.filter((e) => e.id !== id);
  state.entries.forEach((e, i) => (e.number = i + 1));
  await writeState(state);
  return state;
}

export async function saveConfig(
  partial: Partial<RaffleState["config"]>
): Promise<RaffleState> {
  const state = await ensureFile();
  state.config = { ...state.config, ...partial };
  await writeState(state);
  return state;
}

export async function setForcedWinner(entryId: string | null): Promise<RaffleState> {
  const state = await ensureFile();
  state.config.forcedWinnerId = entryId;
  await writeState(state);
  return state;
}

export async function drawWinner(): Promise<{ state: RaffleState; winner: Entry | null }> {
  const state = await ensureFile();
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
  const state = await ensureFile();
  state.entries = [];
  state.config.status = "open";
  state.config.winnerEntryId = null;
  state.config.forcedWinnerId = null;
  await writeState(state);
  return state;
}
