"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CeoGate() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function enter() {
    setLoading(true);
    setError(false);
    const res = await fetch("/api/ceo/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/ceo/dashboard");
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[340px] bg-card border-2 border-[#232320] p-6 text-center">
        <div className="font-display text-2xl mb-4">
          sortea<span className="text-line">2</span>mx{" "}
          <span className="text-mut text-xs">/ceo</span>
        </div>
        <div className="text-left mb-3">
          <label className="block text-[10px] uppercase tracking-wide text-line font-bold mb-1.5">
            Pin de acceso
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enter()}
            placeholder="••••"
            className="w-full px-3 py-2.5 bg-[#0d0d0d] border border-[#2a2a26] text-ink text-sm focus:outline-none focus:border-line"
          />
        </div>
        <button
          onClick={enter}
          disabled={loading}
          className="w-full py-3 bg-line text-bg font-bold text-xs uppercase tracking-wide"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
        {error && <div className="text-pink text-[11px] mt-2">Pin incorrecto.</div>}
        <div className="mt-4 text-[11px] text-mut">
          <Link href="/" className="underline text-line">
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
