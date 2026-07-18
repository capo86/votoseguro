import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Fingerprint,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import logoUrl from "../../logo.jpg";
import CandidatoSelect from "../components/form/CandidatoSelect";
import CedulaLookupField from "../components/form/CedulaLookupField";
import LocationPickerMap from "../components/form/LocationPickerMap";
import PadronReadonlyFields from "../components/form/PadronReadonlyFields";
import PhoneField from "../components/form/PhoneField";
import Button from "../components/ui/Button";
import TextInput from "../components/ui/TextInput";
import { usePadronLookup } from "../hooks/usePadronLookup";
import type { Candidato } from "../types/candidato";
import type { RegistroVotanteFormValues } from "../types/votante";

const candidatos: Candidato[] = [
  {
    id: "candidato-ppc-1",
    nombre: "PPC Lista Naranja",
    cargo: "Intendencia",
    activo: true,
  },
  {
    id: "candidato-ppc-2",
    nombre: "Equipo Territorial PPC",
    cargo: "Concejalía",
    activo: true,
  },
];

const registroSchema = z.object({
  cedula: z.string().regex(/^\d{5,10}$/, "Ingresa una cedula numerica valida."),
  nombreApellido: z.string().min(3, "Ingresa nombre y apellido."),
  departamento: z.string().min(1, "Consulta una cedula para completar este dato."),
  distrito: z.string().min(1, "Consulta una cedula para completar este dato."),
  zona: z.string().min(1, "Consulta una cedula para completar este dato."),
  local: z.string().min(1, "Consulta una cedula para completar este dato."),
  telefono: z.string().regex(/^09\d{8}$/, "Usa el formato paraguayo 09XXXXXXXX."),
  candidatoId: z.string().min(1, "Selecciona un candidato."),
  ubicacion: z.object(
    {
      lat: z.number(),
      lng: z.number(),
    },
    { required_error: "Marca la ubicacion del votante." },
  ),
});

const emptyPadron = {
  departamento: "",
  distrito: "",
  local: "",
  zona: "",
};

function RegistroVotantePage() {
  const padronLookup = usePadronLookup();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    trigger,
    watch,
  } = useForm<RegistroVotanteFormValues>({
    defaultValues: {
      candidatoId: "",
      cedula: "",
      departamento: "",
      distrito: "",
      local: "",
      nombreApellido: "",
      telefono: "",
      ubicacion: undefined,
      zona: "",
    },
    mode: "onTouched",
    resolver: zodResolver(registroSchema),
  });

  const cedula = watch("cedula");
  const padronValues = {
    departamento: watch("departamento"),
    distrito: watch("distrito"),
    local: watch("local"),
    zona: watch("zona"),
  };
  const nombreApellido = watch("nombreApellido");
  const candidatoId = watch("candidatoId");
  const ubicacion = watch("ubicacion");

  const selectedCandidato = useMemo(
    () => candidatos.find((candidato) => candidato.id === candidatoId),
    [candidatoId],
  );

  useEffect(() => {
    if (!padronLookup.data) {
      return;
    }

    setValue("nombreApellido", padronLookup.data.nombreApellido, { shouldValidate: true });
    setValue("departamento", padronLookup.data.departamento, { shouldValidate: true });
    setValue("distrito", padronLookup.data.distrito, { shouldValidate: true });
    setValue("zona", padronLookup.data.zona, { shouldValidate: true });
    setValue("local", padronLookup.data.local, { shouldValidate: true });
    setSaveStatus("idle");
  }, [padronLookup.data, setValue]);

  const handleLookup = async () => {
    const validCedula = await trigger("cedula");

    if (!validCedula) {
      return;
    }

    await padronLookup.lookup(cedula);
  };

  const handleLocationChange = (location: NonNullable<RegistroVotanteFormValues["ubicacion"]>) => {
    setValue("ubicacion", location, { shouldDirty: true, shouldValidate: true });
    setSaveStatus("idle");
  };

  const onSubmit = async (values: RegistroVotanteFormValues) => {
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    console.info("Registro local VotoSeguro", values);
    setSaveStatus("saved");
  };

  const hasPadron = Object.values(padronValues).every(Boolean);

  return (
    <main className="voto-page min-h-screen overflow-hidden bg-brand-ink text-white">
      <div className="voto-sunburst" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-7">
        <aside className="order-2 flex flex-col justify-between rounded-panel border border-brand-line bg-brand-coal/80 p-5 shadow-panel backdrop-blur lg:order-1 lg:min-h-[calc(100vh-3.5rem)] lg:p-7">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <img
                alt="PPC"
                className="h-16 w-16 rounded-panel bg-white object-cover ring-2 ring-brand-orange"
                src={logoUrl}
              />
              <div>
                <p className="font-body text-xs font-black uppercase text-brand-orange">
                  VotoSeguro
                </p>
                <h1 className="font-display text-3xl text-white sm:text-4xl">Registro PPC</h1>
              </div>
            </div>

            <div className="voto-meter">
              <div className="voto-meter-ring">
                <ShieldCheck aria-hidden="true" size={42} strokeWidth={2.4} />
              </div>
              <div>
                <p className="font-body text-xs font-black uppercase text-orange-100/70">
                  Control territorial
                </p>
                <p className="mt-2 max-w-sm font-body text-xl font-black leading-tight text-white">
                  Cedula, padron, telefono, ubicacion y candidato en una sola carga.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="status-row">
                <Fingerprint aria-hidden="true" size={20} strokeWidth={2.6} />
                <span>{padronLookup.status === "found" ? "Padron verificado" : "Padron pendiente"}</span>
              </div>
              <div className="status-row">
                <UserRound aria-hidden="true" size={20} strokeWidth={2.6} />
                <span>{nombreApellido || "Votante sin identificar"}</span>
              </div>
              <div className="status-row">
                <ClipboardCheck aria-hidden="true" size={20} strokeWidth={2.6} />
                <span>{selectedCandidato?.nombre ?? "Preferencia pendiente"}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 border-t border-brand-line pt-5">
            <div>
              <p className="metric-label">Cedula</p>
              <p className="metric-value">{cedula || "—"}</p>
            </div>
            <div>
              <p className="metric-label">Distrito</p>
              <p className="metric-value">{padronValues.distrito || "—"}</p>
            </div>
            <div>
              <p className="metric-label">Mapa</p>
              <p className="metric-value">{ubicacion ? "OK" : "—"}</p>
            </div>
          </div>
        </aside>

        <section className="order-1 rounded-panel border border-brand-line bg-neutral-900/92 p-4 shadow-panel backdrop-blur lg:order-2 lg:p-7">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-brand-line pb-5">
              <div>
                <p className="font-body text-xs font-black uppercase text-brand-orange">
                  Carga de votante
                </p>
                <h2 className="mt-1 font-display text-3xl text-white sm:text-4xl">
                  Padron electoral
                </h2>
              </div>
              <div className="rounded-panel border border-brand-line bg-black/20 px-3 py-2 font-body text-sm font-black text-orange-50/80">
                Fase 1
              </div>
            </div>

            <CedulaLookupField
              error={errors.cedula?.message}
              onLookup={handleLookup}
              register={register("cedula", {
                onChange: () => {
                  setSaveStatus("idle");
                  padronLookup.reset();
                  if (hasPadron) {
                    setValue("departamento", emptyPadron.departamento, { shouldValidate: false });
                    setValue("distrito", emptyPadron.distrito, { shouldValidate: false });
                    setValue("zona", emptyPadron.zona, { shouldValidate: false });
                    setValue("local", emptyPadron.local, { shouldValidate: false });
                  }
                },
              })}
              status={padronLookup.status}
            />

            {padronLookup.error ? (
              <div className="flex items-center gap-2 rounded-panel border border-red-300/30 bg-red-500/10 px-4 py-3 font-body text-sm font-bold text-red-100">
                <AlertCircle aria-hidden="true" size={18} strokeWidth={2.6} />
                {padronLookup.error}
              </div>
            ) : null}

            <TextInput
              autoComplete="name"
              error={errors.nombreApellido?.message}
              icon={<UserRound aria-hidden="true" size={19} strokeWidth={2.6} />}
              id="nombreApellido"
              label="Nombre y apellido"
              placeholder="Se completa desde el padron"
              {...register("nombreApellido", { onChange: () => setSaveStatus("idle") })}
            />

            <PadronReadonlyFields {...padronValues} />

            <div className="grid gap-4 md:grid-cols-2">
              <PhoneField
                error={errors.telefono?.message}
                register={register("telefono", { onChange: () => setSaveStatus("idle") })}
              />
              <CandidatoSelect
                candidatos={candidatos}
                error={errors.candidatoId?.message}
                register={register("candidatoId", { onChange: () => setSaveStatus("idle") })}
              />
            </div>

            <LocationPickerMap
              error={errors.ubicacion?.message}
              onChange={handleLocationChange}
              value={ubicacion}
            />

            <div className="flex flex-col gap-3 border-t border-brand-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-6 font-body text-sm font-semibold">
                {saveStatus === "saved" ? (
                  <span className="inline-flex items-center gap-2 text-emerald-200">
                    <CheckCircle2 aria-hidden="true" size={18} strokeWidth={2.6} />
                    Registro preparado en modo local.
                  </span>
                ) : (
                  <span className="text-orange-50/65">Supabase queda listo para la fase de conexion.</span>
                )}
              </div>

              <Button
                className="sm:min-w-56"
                icon={<Save aria-hidden="true" size={18} strokeWidth={2.8} />}
                isLoading={isSubmitting}
                type="submit"
              >
                Guardar registro
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default RegistroVotantePage;
