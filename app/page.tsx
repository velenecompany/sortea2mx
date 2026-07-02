"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Wheel from "@/components/Wheel";
import type { RaffleState } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(4, "0");
}

function countdownText(drawAt: string | null) {
  if (!drawAt) return "—";
  const diff = new Date(drawAt).getTime() - Date.now();
  if (diff <= 0) return "¡ya!";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function burstConfetti() {
  const colors = ["#C6FF3D", "#FF3D8A", "#F2F2ED"];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = 2 + Math.random() * 1.5 + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3800);
  }
}

export default function PublicPage() {
  const [state, setState] = useState<RaffleState | null>(null);
  const [name, setName] = useState("");
  const [confirmMsg, setConfirmMsg] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [, forceTick] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/raffle", { cache: "no-store" });
    const data = await res.json();
    setState(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function join() {
    const trimmed = name.trim();
    if (!trimmed || !state || state.config.status === "drawn") return;
    const res = await fetch("/api/raffle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      setState(data);
      setName("");
      setConfirmMsg(true);
      setTimeout(() => setConfirmMsg(false), 2500);
    }
  }

  async function spin() {
    if (!state || state.entries.length === 0 || state.config.status === "drawn" || spinning) return;

    const scheduled = state.config.drawAt && new Date(state.config.drawAt).getTime() > Date.now();
    if (scheduled) return;

    setSpinning(true);
    const res = await fetch("/api/raffle/draw", { method: "POST" });
    if (!res.ok) {
      setSpinning(false);
      return;
    }
    const data: RaffleState & { winner: RaffleState["entries"][number] | null } = await res.json();
    const winnerIdx = data.entries.findIndex((e) => e.id === data.winner?.id);
    const segAngle = 360 / state.entries.length;
    const center = winnerIdx * segAngle + segAngle / 2;
    const jitter = (Math.random() - 0.5) * segAngle * 0.5;
    const newRotation = rotation + 360 * 6 + (270 - center - jitter);
    setRotation(newRotation);

    setTimeout(() => {
      setState(data);
      setSpinning(false);
    }, 4600);
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-mut text-sm">
        Cargando…
      </div>
    );
  }

  const { config, entries } = state;
  const scheduled = config.drawAt && new Date(config.drawAt).getTime() > Date.now();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-16">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div className="font-display text-2xl lg:text-3xl tracking-wide">
          sortea<span className="text-line">2</span>mx
        </div>
        <div className="text-[9.5px] font-bold uppercase tracking-wide border border-dashed border-line text-line px-2 py-1 -rotate-3 inline-block">
          100% gratis
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start">
        <div>
          <div className="bg-card border-2 border-[#232320] p-5 lg:p-7 mb-4">
            <div className="text-[10px] tracking-widest uppercase text-mut mb-1.5">
              Sorteo activo
            </div>
            <h1 className="font-display text-4xl lg:text-5xl leading-none mb-2">{config.title}</h1>
            <p className="text-[13px] lg:text-sm text-[#c8c8c2] leading-relaxed mb-3.5 max-w-[50ch]">
              {config.description}
            </p>
            <div className="flex gap-2 flex-wrap mb-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wide border border-line text-line px-2 py-1">
                {config.mode === "instagram" ? "Vía Instagram" : "Registro directo"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide border border-lineDim text-mut px-2 py-1">
                {config.status === "drawn" ? "Sorteado" : "Abierto"}
              </span>
            </div>
            <div className="flex gap-6 lg:gap-10 pt-3 border-t border-dashed border-[#2a2a26]">
              <div>
                <div className="font-display text-2xl lg:text-3xl text-pink">{config.prize}</div>
                <div className="text-[9.5px] uppercase tracking-wide text-mut mt-0.5">Premio</div>
              </div>
              <div>
                <div className="font-display text-2xl lg:text-3xl text-pink">{entries.length}</div>
                <div className="text-[9.5px] uppercase tracking-wide text-mut mt-0.5">Participantes</div>
              </div>
              <div>
                <div className="font-display text-2xl lg:text-3xl text-pink">{countdownText(config.drawAt)}</div>
                <div className="text-[9.5px] uppercase tracking-wide text-mut mt-0.5">Sorteo en</div>
              </div>
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-2 sm:gap-4 lg:block">
            {config.mode === "directo" ? (
              <div className="bg-card border-2 border-[#232320] p-5 lg:p-6 mb-4">
                <h2 className="font-display text-lg mb-3">Entrar al sorteo</h2>
                <label className="block text-[10px] uppercase tracking-wide text-line font-bold mb-1.5">
                  Tu nombre
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder="Ej. Fer G."
                  className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#2a2a26] text-ink text-sm mb-3 focus:outline-none focus:border-line"
                />
                <button
                  onClick={join}
                  disabled={config.status === "drawn"}
                  className="w-full py-3 bg-line text-bg font-bold text-xs uppercase tracking-wide disabled:bg-[#333] disabled:text-[#777]"
                >
                  Quiero participar
                </button>
                {confirmMsg && <div className="mt-2.5 text-xs text-line">Listo, ya estás dentro ✔</div>}
              </div>
            ) : (
              <div className="bg-card border-2 border-[#232320] p-5 lg:p-6 mb-4">
                <h2 className="font-display text-lg mb-1">Participantes vía Instagram</h2>
                <p className="text-[13px] text-[#c8c8c2]">
                  Los participantes de este sorteo se toman de los comentarios del post/live. No
                  necesitas registrarte aquí.
                </p>
              </div>
            )}

            <div className="bg-card border-2 border-[#232320] p-5 lg:p-6 mb-4">
              <h2 className="font-display text-lg mb-3">Participantes</h2>
              {entries.length === 0 ? (
                <p className="text-xs text-mut">Todavía nadie entra. Sé el primero.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {entries.slice(0, 60).map((en) => (
                    <div key={en.id} className="text-[11px] border border-dashed border-[#333] px-2 py-1 text-[#c8c8c2]">
                      <b className="text-line">#{pad(en.number)}</b> {en.name}
                    </div>
                  ))}
                  {entries.length > 60 && (
                    <div className="text-[11px] border border-dashed border-[#333] px-2 py-1 text-[#c8c8c2]">
                      +{entries.length - 60} más
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-8 bg-card border-2 border-[#232320] p-6 flex flex-col items-center">
          <h2 className="font-display text-lg mb-3 self-start">Ruleta</h2>
          <div className="my-2.5">
            <Wheel entries={entries} rotation={rotation} />
          </div>
          <button
            onClick={spin}
            disabled={entries.length === 0 || config.status === "drawn" || !!scheduled}
            className="w-full py-3 px-5 bg-line text-bg font-bold text-xs uppercase tracking-wide disabled:bg-[#333] disabled:text-[#777]"
          >
            {config.status === "drawn" ? "Sorteo cerrado" : scheduled ? "Aún no es hora" : "Girar la ruleta"}
          </button>

          {config.status === "drawn" && config.winnerEntryId && (
            <WinnerBox entries={entries} winnerId={config.winnerEntryId} />
          )}
        </div>
      </div>

      <div className="text-center mt-6 text-[11px] text-mut">
        sortea2mx no guarda pagos ni datos sensibles ·{" "}
        <Link href="/ceo" className="underline text-line">
          Panel de creadores
        </Link>
      </div>
    </div>
  );
}

function WinnerBox({ entries, winnerId }: { entries: RaffleState["entries"]; winnerId: string }) {
  const winner = entries.find((e) => e.id === winnerId);
  useEffect(() => {
    if (winner) burstConfetti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!winner) return null;
  return (
    <div className="mt-4 p-4 border-2 border-line text-center w-full">
      <div className="text-[10px] tracking-widest uppercase text-line">Ganador</div>
      <div className="font-display text-3xl my-1.5">{winner.name}</div>
      <div className="text-[11px] text-mut">#{pad(winner.number)}</div>
    </div>
  );
}
