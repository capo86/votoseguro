import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmModalProps {
  confirmLabel?: string;
  isLoading?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "warning";
}

function ConfirmModal({
  confirmLabel = "Confirmar",
  isLoading = false,
  message,
  onCancel,
  onConfirm,
  title,
  tone = "danger",
}: ConfirmModalProps) {
  const isDanger = tone === "danger";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-brand-ink/70 p-3 backdrop-blur-sm sm:place-items-center sm:p-6">
      <button
        aria-label="Cancelar"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
        tabIndex={-1}
        type="button"
      />

      <section
        aria-labelledby="confirm-modal-title"
        aria-modal="true"
        className="relative w-full max-w-lg overflow-hidden rounded-panel border border-red-300 bg-white p-5 shadow-panel sm:p-6 dark:border-red-300/30 dark:bg-neutral-950"
        role="dialog"
      >
        <button
          aria-label="Cerrar modal"
          className="absolute right-3 top-3 grid min-h-10 w-10 place-items-center rounded-panel border border-neutral-200 bg-white text-neutral-600 transition hover:border-red-500 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-brand-line dark:bg-white/[0.06] dark:text-orange-50/70"
          onClick={onCancel}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2.8} />
        </button>

        <div className="flex items-start gap-4 pr-10">
          <div
            className={[
              "grid h-14 w-14 shrink-0 place-items-center rounded-panel text-white shadow-action",
              isDanger ? "bg-red-600" : "bg-brand-orange",
            ].join(" ")}
          >
            <AlertTriangle aria-hidden="true" size={30} strokeWidth={2.8} />
          </div>
          <div className="min-w-0">
            <p className="font-body text-xs font-black uppercase text-red-700 dark:text-red-200">
              Confirmacion requerida
            </p>
            <h2
              className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white"
              id="confirm-modal-title"
            >
              {title}
            </h2>
          </div>
        </div>

        <p className="mt-5 font-body text-sm font-semibold leading-relaxed text-neutral-600 dark:text-orange-50/70">
          {message}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-panel border border-neutral-300 bg-white px-5 py-3 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={[
              "inline-flex min-h-12 items-center justify-center gap-2 rounded-panel px-5 py-3 font-body text-sm font-black uppercase text-white shadow-action transition disabled:cursor-not-allowed disabled:opacity-70",
              isDanger ? "bg-red-600 hover:bg-red-500" : "bg-brand-orange hover:bg-orange-500",
            ].join(" ")}
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={17} strokeWidth={2.8} />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
