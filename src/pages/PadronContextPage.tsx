import { ArrowRight, Database, FileArchive, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

function PadronContextPage() {
  return (
    <section className="space-y-4">
      <section className="voto-card overflow-hidden rounded-panel border border-neutral-200 bg-white/[0.9] shadow-panel backdrop-blur dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Padron</p>
            <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white">
              Migracion del padron electoral
            </h2>
            <p className="mt-3 max-w-2xl font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              Este modulo queda reservado para importar y normalizar los datos fuente del padron.
              La carga territorial diaria vive en Voto Seguro.
            </p>
          </div>

          <div className="rounded-panel border border-brand-orange/40 bg-brand-orange/10 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-panel bg-brand-orange text-brand-ink">
                <FileArchive aria-hidden="true" size={23} strokeWidth={2.8} />
              </div>
              <div>
                <p className="font-body text-xs font-black uppercase text-brand-orange">Fuente pendiente</p>
                <p className="font-body text-sm font-bold text-neutral-700 dark:text-orange-50/80">
                  Tablas DBF del padron de Paraguay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatusPanel
          icon={<FileArchive aria-hidden="true" size={22} strokeWidth={2.7} />}
          label="Origen"
          value="DBF pendiente"
        />
        <StatusPanel
          icon={<Database aria-hidden="true" size={22} strokeWidth={2.7} />}
          label="Destino"
          value="Supabase"
        />
        <StatusPanel
          icon={<ShieldCheck aria-hidden="true" size={22} strokeWidth={2.7} />}
          label="Operacion"
          value="Voto Seguro"
        />
      </section>

      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="flex items-start gap-3">
          <ArrowRight aria-hidden="true" className="mt-1 shrink-0 text-brand-orange" size={20} strokeWidth={2.8} />
          <div>
            <h3 className="font-display text-2xl text-brand-ink dark:text-white">
              Siguiente cierre tecnico
            </h3>
            <p className="mt-2 font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              Cuando tengamos la estructura de las DBF, aca conviene crear tablas de importacion,
              normalizar departamentos, ciudades y locales, y despues conectar la consulta por cedula.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

interface StatusPanelProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function StatusPanel({ icon, label, value }: StatusPanelProps) {
  return (
    <div className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur dark:border-brand-line dark:bg-neutral-900/[0.92]">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-panel bg-brand-orange text-brand-ink">
        {icon}
      </div>
      <p className="font-body text-xs font-black uppercase text-brand-orange">{label}</p>
      <p className="mt-1 font-display text-xl text-brand-ink dark:text-white">{value}</p>
    </div>
  );
}

export default PadronContextPage;
