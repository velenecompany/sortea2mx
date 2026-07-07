export type EntrySource = "manual" | "instagram";

export interface Entry {
  id: string;
  name: string;
  number: number;
  source: EntrySource;
  ts: number;
}

export type RaffleMode = "directo" | "instagram";
export type RaffleStatus = "open" | "drawn";

export interface RaffleConfig {
  slug: string;
  title: string;
  prize: string;
  description: string;
  mode: RaffleMode;
  drawAt: string | null; // ISO date string
  status: RaffleStatus;
  winnerEntryId: string | null;
  forcedWinnerId: string | null;
  createdAt: string;
}

export interface RaffleState {
  config: RaffleConfig;
  entries: Entry[];
}

export interface RaffleSummary {
  slug: string;
  title: string;
  prize: string;
  status: RaffleStatus;
  entryCount: number;
  createdAt: string;
}

export interface NewRaffleInput {
  title: string;
  prize: string;
  description: string;
  mode: RaffleMode;
}
