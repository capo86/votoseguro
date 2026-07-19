import { AlertTriangle, X } from "lucide-react";

export interface AlertModalDetail {
  label: string;
  value: string;
}

interface AlertModalProps {
  actionLabel?: string;
  details?: AlertModalDetail[];
  message: string;
  onClose: () => void;
  title: string;
}

function AlertModal({
  actionLabel = "Entendido",
  details = [],
  message,
  onClose,
  title,
}: AlertModalProps) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-brand-ink/70 p-3 backdrop-blur-sm sm:place-items-center sm:p-6">
      <button
        aria-label="Cerrar alerta"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />

      <section
        aria-labelledby="alert-modal-title"
        aria-live="assertive"
        aria-modal="true"
        className="relative w-full max-w-lg overflow-hidden rounded-panel border border-brand-orange bg-white p-5 shadow-panel sm:p-6 dark:border-brand-orange/60 dark:bg-neutral-950"
        role="alertdialog"
      >
        <button
          aria-label="Cerrar modal"
          className="absolute right-3 top-3 grid min-h-10 w-10 place-items-center rounded-panel border border-neutral-200 bg-white text-neutral-600 transition hover:border-brand-orange hover:text-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-orange-50/70"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.8} />
        </button>

        <div className="flex items-start gap-4 pr-10">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-panel bg-brand-orange text-brand-ink shadow-action">
            <AlertTriangle aria-hidden="true" size={34} strokeWidth={2.8} />
          </div>
          <div className="min-w-0">
            <p className="font-body text-xs font-black uppercase text-brand-orange">
              Atencion
            </p>
            <h2
              className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white"
              id="alert-modal-title"
            >
              {title}
            </h2>
          </div>
        </div>

        <p className="mt-5 font-body text-base font-black leading-relaxed text-brand-ink dark:text-orange-50">
          {message}
        </p>

        {details.length > 0 ? (
          <div className="mt-5 grid gap-2 rounded-panel border border-brand-orange/30 bg-brand-orange/10 p-4">
            {details.map((detail) => (
              <div className="min-w-0" key={detail.label}>
                <p className="font-body text-[0.68rem] font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
                  {detail.label}
                </p>
                <p className="mt-0.5 truncate font-body text-sm font-black text-brand-ink dark:text-white">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button
            autoFocus
            className="inline-flex min-h-12 min-w-40 items-center justify-center rounded-panel bg-brand-orange px-5 py-3 font-body text-sm font-black uppercase text-brand-ink shadow-action transition hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
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

export default AlertModal;
