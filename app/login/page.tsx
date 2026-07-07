"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo iniciar sesión.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[360px] bg-card border-2 border-[#232320] p-6">
        <div className="font-display text-2xl mb-1 text-center">
          sortea<span className="text-line">2</span>mx
        </div>
        <p className="text-mut text-xs text-center mb-5">Inicia sesión para administrar tus sorteos</p>

        <div className="mb-3">
          <label className="block text-[10px] uppercase tracking-wide text-line font-bold mb-1.5">
            Correo
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="tu@correo.com"
          />
        </div>
        <div className="mb-4">
          <label className="block text-[10px] uppercase tracking-wide text-line font-bold mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="input"
            placeholder="••••••••"
          />
        </div>

        <button onClick={submit} disabled={loading} className="btn-main btn-block">
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>

        {error && <div className="text-pink text-[11px] mt-3 text-center">{error}</div>}

        <div className="text-center mt-4 text-[11px] text-mut">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="underline text-line">
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
