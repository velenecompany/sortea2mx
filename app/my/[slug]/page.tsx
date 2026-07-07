"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Wheel from "@/components/Wheel";
import type { RaffleState } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(4, "0");
}

export default function MyRaffleDashboard() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [state, setState] = useState<RaffleState | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ title: "", prize: "", description: "", mode: "directo", drawAt: "" });
  const [igList, setIgList] = useState("");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const adminAction = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const res = await fetch(`/api/my-raffle/admin/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) throw new Error("Acción falló");
      return res.json();
    },
    [slug]
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/raffle/${slug}`, { cache: "no-store" });
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    const data: RaffleState = await res.json();
    setState(data);
    setForm({
      title: data.config.title,
      prize: data.config.prize,
      description: data.config.description,
      mode: data.config.mode,
      drawAt: data.config.drawAt ? data.config.drawAt.slice(0, 16) : "",
    });
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveConfig() {
    const data = await adminAction("saveConfig", {
      config: {
        title: form.title,
        prize: form.prize,
        description: form.description,
        mode: form.mode,
        drawAt: form.drawAt ? new Date(form.drawAt).toISOString() : null,
      },
    });
    setState(data);
  }

  async function importIg() {
    const data = await adminAction("importInstagram", { names: igList });
    setState(data);
    setIgList("");
  }

  async function removeEntry(id: string) {
    const data = await adminAction("removeEntry", { id });
    setState(data);
  }

  async function setForcedWinner(entryId: string) {
    const data = await adminAction("setForcedWinner", { entryId: entryId || null });
    setState(data);
  }

  async function reset() {
    if (!confirm("Esto borra a todos los participantes y reinicia el sorteo. ¿Seguro?")) return;
    const data = await adminAction("reset");
    setState(data);
    setRotation(0);
  }

  async function deleteRaffle() {
    if (!confirm(`Esto elimina "${state?.config.title}" por completo, incluyendo participantes. ¿Seguro?`)) return;
    await adminAction("delete");
    router.push("/");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function spin() {
    if (!state || state.entries.length === 0 || state.config.status === "drawn" || spinning) return;
    setSpinning(true);
    const res = await fetch(`/api/raffle/${slug}/draw`, { method: "POST" });
    if (!res.ok) {
      setSpinning(false);
      return;
    }
    const data: RaffleState & { winner: RaffleState["entries"][number] | null } = await res.json();
    const winnerIdx = data.entries.findIndex((e) => e.id === data.winner?.id);
    const segAngle = 360 / state.entries.length;
    const center = winnerIdx * segAngle + segAngle / 2;
    const newRotation = rotation + 360 * 6 + (270 - center);
    setRotation(newRotation);
    setTimeout(() => {
      setState(data);
      setSpinning(false);
    }, 4600);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="font-display text-2xl">Ese sorteo no existe</div>
        <Link href="/" className="text-line underline text-sm">
          Volver a tus sorteos
        </Link>
      </div>
    );
  }

  if (!state) {
    return <div className="min-h-screen flex items-center justify-center text-mut text-sm">Cargando…</div>;
  }

  const { config, entries } = state;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-16">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <Link href="/" className="text-mut text-[11px] underline">
            ← Tus sorteos
          </Link>
          <div className="font-display text-2xl lg:text-3xl mt-1">{config.title}</div>
        </div>
        <button onClick={logout} className="border border-lineDim px-3 py-2 text-[10px] uppercase tracking-wide">
          Salir
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 lg:items-start">
        <div>
          <Section title="Configurar sorteo">
            <div className="sm:grid sm:grid-cols-2 sm:gap-x-4">
              <Field label="Título">
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Premio">
                <input className="input" value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} />
              </Field>
            </div>
            <Field label="Descripción">
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="sm:grid sm:grid-cols-2 sm:gap-x-4">
              <Field label="Modo de participación">
                <select
                  className="input"
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                >
                  <option value="directo">Registro directo (la gente escribe su nombre)</option>
                  <option value="instagram">Comentarios de Instagram (tú importas la lista)</option>
                </select>
              </Field>
              <Field label="Programar sorteo para">
                <input
                  type="datetime-local"
                  className="input"
                  value={form.drawAt}
                  onChange={(e) => setForm({ ...form, drawAt: e.target.value })}
                />
              </Field>
            </div>
            <button onClick={saveConfig} className="btn-main">Guardar configuración</button>
          </Section>

          {form.mode === "instagram" && (
            <Section title="Importar comentarios de Instagram">
              <Field label="Un usuario por línea">
                <textarea
                  className="input min-h-[90px]"
                  value={igList}
                  onChange={(e) => setIgList(e.target.value)}
                  placeholder={"@usuario1\n@usuario2"}
                />
              </Field>
              <button onClick={importIg} className="btn-out">Importar a la lista</button>
            </Section>
          )}

          <Section title={`Participantes (${entries.length})`}>
            {entries.length === 0 ? (
              <p className="text-xs text-mut">Todavía no hay participantes.</p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-mut uppercase text-[10px]">
                      <th className="text-left py-1.5">#</th>
                      <th className="text-left py-1.5">Nombre</th>
                      <th className="text-left py-1.5">Origen</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((en) => (
                      <tr key={en.id} className="border-t border-[#232320]">
                        <td className="py-1.5">#{pad(en.number)}</td>
                        <td className="py-1.5">{en.name}</td>
                        <td className="py-1.5">{en.source === "instagram" ? "IG" : "directo"}</td>
                        <td className="py-1.5 text-right">
                          <button onClick={() => removeEntry(en.id)} className="text-pink">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="">
            <button onClick={deleteRaffle} className="w-full py-3 border-2 border-pink text-pink font-bold text-xs uppercase tracking-wide">
              Eliminar este sorteo
            </button>
          </Section>
        </div>

        <div className="lg:sticky lg:top-8">
          <Section title="Elegir ganador de todos">
            <p className="text-[13px] text-[#c8c8c2] mb-2.5">
              Opcional. Si eliges a alguien aquí, la ruleta siempre caerá en esa persona sin importar
              el giro — nadie más que tú puede ver esta selección.
            </p>
            <div className="max-h-40 overflow-y-auto">
              <label className="radio-row">
                <input
                  type="radio"
                  name="wp"
                  checked={!config.forcedWinnerId}
                  onChange={() => setForcedWinner("")}
                />
                Aleatorio (sin elegir)
              </label>
              {entries.map((en) => (
                <label key={en.id} className="radio-row">
                  <input
                    type="radio"
                    name="wp"
                    checked={config.forcedWinnerId === en.id}
                    onChange={() => setForcedWinner(en.id)}
                  />
                  #{pad(en.number)} — {en.name}
                </label>
              ))}
            </div>
          </Section>

          <div className="bg-card border-2 border-[#232320] p-6 flex flex-col items-center mb-4">
            <h2 className="font-display text-lg mb-3 self-start">Ruleta</h2>
            <div className="my-2.5">
              <Wheel entries={entries} rotation={rotation} />
            </div>
            <button
              onClick={spin}
              disabled={entries.length === 0 || config.status === "drawn" || spinning}
              className="btn-main w-full"
            >
              {config.status === "drawn" ? "Sorteo cerrado" : "Girar la ruleta"}
            </button>
          </div>

          <Section title="">
            <button onClick={reset} className="w-full py-3 border-2 border-pink text-pink font-bold text-xs uppercase tracking-wide">
              Reiniciar sorteo (borra participantes)
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border-2 border-[#232320] p-5 mb-4">
      {title && <h2 className="font-display text-lg mb-3">{title}</h2>}
      {children}
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
