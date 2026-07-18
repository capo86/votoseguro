import { ShieldCheck, Smartphone, UserCheck } from "lucide-react";

function VotoSeguroHomePage() {
  return (
    <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.88] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
      <p className="font-body text-xs font-black uppercase text-brand-orange">VotoSeguro</p>
      <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink dark:text-white">
        Control de carga
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            label: "Acceso",
            value: "Auth Supabase activo",
          },
          {
            icon: UserCheck,
            label: "Padron",
            value: "Consulta mock lista",
          },
          {
            icon: Smartphone,
            label: "Mobile",
            value: "Flujo primero telefono",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              className="rounded-panel border border-neutral-200 bg-white/70 p-4 dark:border-brand-line dark:bg-black/[0.18]"
              key={item.label}
            >
              <Icon aria-hidden="true" className="text-brand-orange" size={24} strokeWidth={2.7} />
              <p className="mt-4 font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
                {item.label}
              </p>
              <p className="mt-1 font-body text-lg font-black leading-tight text-brand-ink dark:text-white">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default VotoSeguroHomePage;
