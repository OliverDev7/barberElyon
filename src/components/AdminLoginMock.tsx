import Link from "next/link";
import { BrandMark, Button, Panel } from "./ui";

export function AdminLoginMock() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7faf8] px-4 py-10 text-neutral-950">
      <section className="w-full max-w-md">
        <BrandMark />
        <Panel className="mt-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-950">Panel Admin</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Ingreso del barbero</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Acceso visual exclusivo para que el barbero gestione datos y agenda en una futura version.
          </p>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-neutral-700">
              Correo
              <input className="focus-ring min-h-12 rounded-lg border border-neutral-200 bg-white px-4" placeholder="barbero@elyonbarber.cl" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-neutral-700">
              Contrasena
              <input className="focus-ring min-h-12 rounded-lg border border-neutral-200 bg-white px-4" placeholder="••••••••" type="password" />
            </label>
            <Button>Ingresar al panel</Button>
            <Link className="text-center text-sm font-bold text-teal-950" href="/reservar/elyon-barber">
              Volver a reservas
            </Link>
          </div>
        </Panel>
      </section>
    </main>
  );
}
