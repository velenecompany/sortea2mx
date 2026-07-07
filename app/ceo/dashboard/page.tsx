"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RaffleMode, RaffleSummary } from "@/lib/types";

export default function CeoDashboardHome() {
  const [raffles, setRaffles] = useState<RaffleSummary[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; prize: string; description: string; mode: RaffleMode }>({
    title: "",
    prize: "",
    description: "",
    mode: "directo",
  });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch("/api/raffles", { cache: "no-store" });
    const data = await res.json();
    setRaffles(data.raffles || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/ceo/logout", { method: "POST" });
    router.push("/ceo");
  }

  async function createRaffle() {
    if (!form.title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/raffle/admin/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      const config = await res.json();
      router.push(`/ceo/dashboard/${config.slug}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-16">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div className="font-display text-2xl lg:text-3xl">
          sortea<span className="text-line">2</span>mx <span className="text-mut text-sm">/ceo</span>
        </div>
        <button onClick={logout} className="border border-lineDim px-3 py-2 text-[10px] uppercase tracking-wide">
          Salir
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h1 className="font-display text-lg">Tus sorteos</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-main">
          {showForm ? "Cancelar" : "+ Crear sorteo"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border-2 border-[#232320] p-5 mb-4">
          <Field label="Título">
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="sm:grid sm:grid-cols-2 sm:gap-x-4">
            <Field label="Premio">
              <input className="input" value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} />
            </Field>
            <Field label="Modo de participación">
              <select
                className="input"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as RaffleMode })}
              >
                <option value="directo">Registro directo</option>
                <option value="instagram">Comentarios de Instagram</option>
              </select>
            </Field>
          </div>
          <Field label="Descripción">
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <button onClick={createRaffle} disabled={creating || !form.title.trim()} className="btn-main">
            {creating ? "Creando…" : "Crear y administrar"}
          </button>
        </div>
      )}

      {raffles === null ? (
        <p className="text-sm text-mut">Cargando…</p>
      ) : raffles.length === 0 ? (
        <p className="text-sm text-mut">Todavía no has creado ningún sorteo.</p>
      ) : (
        <div className="space-y-2">
          {raffles.map((r) => (
            <Link
              key={r.slug}
              href={`/ceo/dashboard/${r.slug}`}
              className="flex items-center justify-between bg-card border-2 border-[#232320] p-4 hover:border-line transition-colors"
            >
              <div>
                <div className="font-display text-lg leading-none">{r.title}</div>
                <div className="text-[11px] text-mut mt-1">{r.entryCount} participantes</div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-1 ${
                  r.status === "drawn" ? "border-lineDim text-mut" : "border-line text-line"
                }`}
              >
                {r.status === "drawn" ? "Sorteado" : "Abierto"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] uppercase tracking-wide text-line font-bold mb-1.5">{label}</label>
      {children}
    </div>
  );
}
