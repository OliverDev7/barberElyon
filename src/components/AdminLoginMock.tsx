"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandMark, Button, Panel } from "./ui";

export function AdminLoginMock() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md">
        <BrandMark />
        <Panel className="mt-8">
          <p className="eyebrow">Panel Admin</p>
          <h1 className="section-title mt-3">Ingreso del barbero</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">Accede al centro de control para gestionar reservas, servicios y disponibilidad.</p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">
              Correo
              <input className="focus-ring min-h-11 rounded-lg border border-[#dce9e5] bg-white px-4 transition focus:border-teal-950" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" type="email" required />
            </label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">
              Contraseña
              <input className="focus-ring min-h-11 rounded-lg border border-[#dce9e5] bg-white px-4 transition focus:border-teal-950" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type="password" required />
            </label>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? "Ingresando..." : "Ingresar al panel"}</Button>
            <Link className="text-center text-sm font-bold text-teal-950" href="/reservar/elyon-barber">Volver a reservas</Link>
          </form>
        </Panel>
      </section>
    </main>
  );
}
