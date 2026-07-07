"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { RaffleSummary } from "@/lib/types";

export default function HomePage() {
  const [raffles, setRaffles] = useState<RaffleSummary[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/raffles", { cache: "no-store" });
    const data = await res.json();
    setRaffles(data.raffles || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-16">
      <div className="flex items-center justify-between mb-8 lg:mb-10">
        <div className="font-display text-2xl lg:text-3xl tracking-wide">
          sortea<span className="text-line">2</span>mx
        </div>
        <div className="text-[9.5px] font-bold uppercase tracking-wide border border-dashed border-line text-line px-2 py-1 -rotate-3 inline-block">
          100% gratis
        </div>
      </div>

      <div className="text-[10px] tracking-widest uppercase text-mut mb-3">Sorteos activos</div>

      {raffles === null ? (
        <p className="text-sm text-mut">Cargando…</p>
      ) : raffles.length === 0 ? (
        <div className="bg-card border-2 border-[#232320] p-6 text-center">
          <p className="text-sm text-[#c8c8c2] mb-3">Todavía no hay sorteos.</p>
          <Link href="/ceo" className="text-line underline text-sm">
            Crea el primero desde el panel de creadores
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {raffles.map((r) => (
            <Link
              key={r.slug}
              href={`/r/${r.slug}`}
              className="bg-card border-2 border-[#232320] p-5 hover:border-line transition-colors block"
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-1 ${
                    r.status === "drawn" ? "border-lineDim text-mut" : "border-line text-line"
                  }`}
                >
                  {r.status === "drawn" ? "Sorteado" : "Abierto"}
                </span>
                <span className="text-[10px] text-mut">{r.entryCount} participantes</span>
              </div>
              <div className="font-display text-2xl leading-none mb-1">{r.title}</div>
              <div className="text-pink text-sm font-bold">{r.prize}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center mt-8 text-[11px] text-mut">
        sortea2mx no guarda pagos ni datos sensibles ·{" "}
        <Link href="/ceo" className="underline text-line">
          Panel de creadores
        </Link>
      </div>
    </div>
  );
}
