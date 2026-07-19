import { toPng } from "html-to-image";
import {
  AlertCircle,
  CalendarDays,
  Download,
  Hash,
  IdCard,
  Loader2,
  MapPin,
  School,
  Search,
  Share2,
  Vote,
} from "lucide-react";
import { forwardRef, useRef, useState, type FormEvent } from "react";
import Button from "../components/ui/Button";
import TextInput from "../components/ui/TextInput";
import { buscarPorCedula } from "../lib/padronApi";
import type { PadronResponse } from "../types/votante";

function ConsultaPadronPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [padron, setPadron] = useState<PadronResponse | null>(null);
  const canUseNativeShare = "canShare" in navigator && typeof navigator.canShare === "function";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCedula = cedula.replace(/\D/g, "");

    if (!/^\d{5,10}$/.test(normalizedCedula)) {
      setError("Ingresa una cedula valida.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await buscarPorCedula(normalizedCedula);
      setPadron(data);
    } catch (lookupError) {
      setPadron(null);
      setError(lookupError instanceof Error ? lookupError.message : "No se pudo consultar el padron.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportCard = async () => {
    if (!cardRef.current || !padron) {
      return;
    }

    setIsExporting(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: 2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `consulta-padron-${padron.cedula}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Consulta Padron PPC",
        });
        return;
      }

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "No se pudo exportar la imagen.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="space-y-4">
      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Consulta padron</p>
            <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white">
              Tarjeta de votacion
            </h2>
            <p className="mt-2 max-w-2xl font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              Busca una cedula y genera una placa limpia para reenviar por WhatsApp.
            </p>

            <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
              <TextInput
                icon={<IdCard aria-hidden="true" size={19} strokeWidth={2.6} />}
                id="consulta-cedula"
                inputMode="numeric"
                label="Cedula"
                onChange={(event) => setCedula(event.target.value)}
                placeholder="Numero de cedula"
                value={cedula}
              />
              <div className="flex items-end">
                <Button
                  className="w-full sm:min-w-44"
                  icon={
                    isLoading ? (
                      <Loader2 aria-hidden="true" className="animate-spin" size={18} strokeWidth={2.8} />
                    ) : (
                      <Search aria-hidden="true" size={18} strokeWidth={2.8} />
                    )
                  }
                  isLoading={isLoading}
                  type="submit"
                >
                  Consultar
                </Button>
              </div>
            </form>

            {error ? (
              <div className="mt-4 flex items-center gap-2 rounded-panel border border-red-300/50 bg-red-50 px-4 py-3 font-body text-sm font-bold text-red-800 dark:border-red-300/30 dark:bg-red-500/10 dark:text-red-100">
                <AlertCircle aria-hidden="true" size={18} strokeWidth={2.6} />
                {error}
              </div>
            ) : null}

            {padron ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <p className="font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
                  Tarjeta lista para compartir.
                </p>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-panel bg-brand-orange px-4 py-2 font-body text-sm font-black uppercase text-brand-ink shadow-action transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isExporting}
                  onClick={exportCard}
                  type="button"
                >
                  {isExporting ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={17} strokeWidth={2.7} />
                  ) : canUseNativeShare ? (
                    <Share2 aria-hidden="true" size={17} strokeWidth={2.7} />
                  ) : (
                    <Download aria-hidden="true" size={17} strokeWidth={2.7} />
                  )}
                  Exportar imagen
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-panel border border-neutral-200 bg-neutral-50 p-3 dark:border-brand-line dark:bg-black/[0.18]">
            <p className="mb-2 font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
              Vista previa
            </p>
            {padron ? (
              <VotingShareCard padron={padron} ref={cardRef} />
            ) : (
              <div className="grid min-h-[28rem] place-items-center rounded-panel border border-dashed border-neutral-300 bg-white p-6 text-center font-body text-sm font-bold text-neutral-500 dark:border-brand-line dark:bg-brand-field dark:text-orange-50/60">
                Consulta una cedula para generar la tarjeta.
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

interface VotingShareCardProps {
  padron: PadronResponse;
}

const VotingShareCard = forwardRef<HTMLDivElement, VotingShareCardProps>(function VotingShareCard(
  { padron },
  ref,
) {
  return (
    <div
      className="mx-auto w-full max-w-[25rem] overflow-hidden rounded-[20px] border border-neutral-200 bg-white text-brand-ink shadow-panel"
      ref={ref}
    >
      <div className="bg-brand-orange px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <img
              alt="PPC"
              className="h-14 w-14 shrink-0 rounded-panel bg-white object-contain p-1"
              src="/logo-ppc-oficial.png"
            />
            <div className="min-w-0">
              <p className="font-body text-xs font-black uppercase text-brand-ink/75">PPC</p>
              <h3 className="font-display text-[1.45rem] leading-none text-brand-ink">
                Consulta Padron
              </h3>
            </div>
          </div>
          <Vote aria-hidden="true" className="shrink-0" size={24} strokeWidth={2.7} />
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div>
          <p className="font-body text-xs font-black uppercase text-brand-orange">
            Cedula {padron.cedula}
          </p>
          <h4 className="mt-1 font-display text-3xl leading-none text-brand-ink">
            {padron.nombreApellido}
          </h4>
        </div>

        <div className="grid gap-2">
          <ShareMetric icon={<MapPin aria-hidden="true" size={18} />} label="Departamento" value={padron.departamento} />
          <ShareMetric icon={<MapPin aria-hidden="true" size={18} />} label="Distrito" value={padron.distrito} />
          <ShareMetric icon={<School aria-hidden="true" size={18} />} label="Local" value={padron.localVotacion || padron.local} />
          <ShareMetric icon={<Hash aria-hidden="true" size={18} />} label="Zona" value={padron.zona} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniMetric label="Mesa" value={padron.mesa || "A confirmar"} />
          <MiniMetric label="Orden" value={padron.orden || "A confirmar"} />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-4">
          <div>
            <p className="font-body text-[0.68rem] font-black uppercase text-neutral-500">
              Fecha de consulta
            </p>
            <p className="font-body text-sm font-black text-brand-ink">
              {new Intl.DateTimeFormat("es-PY", { dateStyle: "medium" }).format(new Date())}
            </p>
          </div>
          <CalendarDays aria-hidden="true" className="text-brand-orange" size={22} strokeWidth={2.6} />
        </div>
      </div>
    </div>
  );
});

interface ShareMetricProps {
  icon: JSX.Element;
  label: string;
  value: string;
}

function ShareMetric({ icon, label, value }: ShareMetricProps) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr] items-center gap-3 rounded-panel border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="grid h-9 w-9 place-items-center rounded-panel bg-brand-orange/15 text-brand-orange">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-body text-[0.68rem] font-black uppercase text-neutral-500">{label}</p>
        <p className="truncate font-body text-sm font-black text-brand-ink">{value || "-"}</p>
      </div>
    </div>
  );
}

interface MiniMetricProps {
  label: string;
  value: string;
}

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <div className="rounded-panel border border-neutral-200 bg-neutral-50 p-3">
      <p className="font-body text-[0.68rem] font-black uppercase text-neutral-500">{label}</p>
      <p className="mt-1 font-display text-xl leading-none text-brand-ink">{value}</p>
    </div>
  );
}

export default ConsultaPadronPage;
