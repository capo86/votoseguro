import { CheckCircle2, X } from "lucide-react";

export interface SuccessModalDetail {
  label: string;
  value: string;
}

interface SuccessModalProps {
  actionLabel?: string;
  details?: SuccessModalDetail[];
  eyebrow?: string;
  onClose: () => void;
  summary?: string;
  title: string;
}

function SuccessModal({
  actionLabel = "Entendido",
  details = [],
  eyebrow = "Carga confirmada",
  onClose,
  summary = "La informacion quedo guardada correctamente.",
  title,
}: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-brand-ink/70 p-3 backdrop-blur-sm sm:place-items-center sm:p-6">
      <button
        aria-label="Cerrar confirmacion"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />

      <section
        aria-labelledby="success-modal-title"
        aria-live="polite"
        aria-modal="true"
        className="relative w-full max-w-lg overflow-hidden rounded-panel border border-emerald-300 bg-white p-5 shadow-panel sm:p-6 dark:border-emerald-300/30 dark:bg-neutral-950"
        role="dialog"
      >
        <button
          aria-label="Cerrar modal"
          className="absolute right-3 top-3 grid min-h-10 w-10 place-items-center rounded-panel border border-neutral-200 bg-white text-neutral-600 transition hover:border-emerald-500 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-brand-line dark:bg-white/[0.06] dark:text-orange-50/70"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.8} />
        </button>

        <div className="flex items-start gap-4 pr-10">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-panel bg-emerald-600 text-white shadow-action">
            <CheckCircle2 aria-hidden="true" size={34} strokeWidth={2.8} />
          </div>
          <div className="min-w-0">
            <p className="font-body text-xs font-black uppercase text-emerald-700 dark:text-emerald-200">
              {eyebrow}
            </p>
            <h2
              className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white"
              id="success-modal-title"
            >
              {title}
            </h2>
          </div>
        </div>

        {details.length > 0 ? (
          <div className="mt-5 grid gap-2 rounded-panel border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/20 dark:bg-emerald-500/10">
            {details.map((detail) => (
              <div className="min-w-0" key={detail.label}>
                <p className="font-body text-[0.68rem] font-black uppercase text-emerald-800/80 dark:text-emerald-100/75">
                  {detail.label}
                </p>
                <p className="mt-0.5 truncate font-body text-sm font-black text-emerald-950 dark:text-emerald-50">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-4 font-body text-sm font-semibold leading-relaxed text-neutral-600 dark:text-orange-50/70">
          {summary}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
            Puedes cerrar y continuar trabajando.
          </p>
          <button
            autoFocus
            className="inline-flex min-h-12 items-center justify-center rounded-panel bg-emerald-600 px-5 py-3 font-body text-sm font-black uppercase text-white shadow-action transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            onClick={onClose}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default SuccessModal;
