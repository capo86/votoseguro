import { Vote } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { Candidato } from "../../types/candidato";

interface CandidatoSelectProps {
  candidatos: Candidato[];
  error?: string;
  register: UseFormRegisterReturn;
}

function CandidatoSelect({ candidatos, error, register }: CandidatoSelectProps) {
  return (
    <div className="space-y-2">
      <label
        className="block font-body text-xs font-black uppercase text-neutral-600 dark:text-orange-100/80"
        htmlFor="candidatoId"
      >
        Candidato
      </label>
      <div className="relative">
        <Vote
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange"
          size={19}
          strokeWidth={2.6}
        />
        <select
          aria-invalid={Boolean(error)}
          className="min-h-12 w-full appearance-none rounded-panel border border-neutral-300 border-l-4 border-l-brand-orange bg-white px-4 py-3 pl-12 font-body text-base font-black text-brand-ink outline-none transition focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 dark:bg-brand-field"
          id="candidatoId"
          {...register}
        >
          <option value="">Seleccionar</option>
          {candidatos.map((candidato) => (
            <option key={candidato.id} value={candidato.id}>
              {candidato.nombre} · {candidato.cargo}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="font-body text-sm font-semibold text-red-700 dark:text-red-200">{error}</p>
      ) : null}
    </div>
  );
}

export default CandidatoSelect;
