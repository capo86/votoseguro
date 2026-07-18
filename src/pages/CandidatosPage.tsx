import { UsersRound } from "lucide-react";

const candidatosPreview = [
  {
    nombre: "PPC Lista Naranja",
    cargo: "Intendencia",
  },
  {
    nombre: "Equipo Territorial PPC",
    cargo: "Concejalia",
  },
];

function CandidatosPage() {
  return (
    <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.88] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
      <p className="font-body text-xs font-black uppercase text-brand-orange">Candidatos</p>
      <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink dark:text-white">
        Lista disponible
      </h2>

      <div className="mt-5 grid gap-3">
        {candidatosPreview.map((candidato) => (
          <div
            className="flex items-center gap-3 rounded-panel border border-neutral-200 bg-white/70 p-4 dark:border-brand-line dark:bg-black/[0.18]"
            key={candidato.nombre}
          >
            <div className="grid h-11 w-11 place-items-center rounded-panel bg-brand-orange text-brand-ink">
              <UsersRound aria-hidden="true" size={21} strokeWidth={2.8} />
            </div>
            <div>
              <p className="font-body text-base font-black text-brand-ink dark:text-white">
                {candidato.nombre}
              </p>
              <p className="font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
                {candidato.cargo}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CandidatosPage;
