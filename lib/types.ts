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
  title: string;
  prize: string;
  description: string;
  mode: RaffleMode;
  drawAt: string | null; // ISO date string
  status: RaffleStatus;
  winnerEntryId: string | null;
  forcedWinnerId: string | null;
}

export interface RaffleState {
  config: RaffleConfig;
  entries: Entry[];
}

export const DEFAULT_CONFIG: RaffleConfig = {
  title: "Rifa sortea2mx",
  prize: "Premio sorpresa",
  description: "Un boleto, una oportunidad.",
  mode: "directo",
  drawAt: null,
  status: "open",
  winnerEntryId: null,
  forcedWinnerId: null,
};
