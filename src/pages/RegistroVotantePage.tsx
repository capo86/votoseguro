import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
    cargo: "Concejalia",
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
  const ubicacion = watch("ubicacion");

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

  const handleCedulaChange = () => {
    setSaveStatus("idle");
    padronLookup.reset();

    if (Object.values(padronValues).every(Boolean)) {
      setValue("departamento", emptyPadron.departamento, { shouldValidate: false });
      setValue("distrito", emptyPadron.distrito, { shouldValidate: false });
      setValue("zona", emptyPadron.zona, { shouldValidate: false });
      setValue("local", emptyPadron.local, { shouldValidate: false });
    }
  };

  const onSubmit = async (values: RegistroVotanteFormValues) => {
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    console.info("Registro local VotoSeguro", values);
    setSaveStatus("saved");
  };

  return (
    <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.88] p-4 shadow-panel backdrop-blur sm:p-5 lg:p-7 dark:border-brand-line dark:bg-neutral-900/[0.92]">
      <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-3 border-b border-neutral-200 pb-5 sm:grid-cols-[1fr_auto] sm:items-start dark:border-brand-line">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">
              Carga de votante
            </p>
            <h1 className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white">
              Padron electoral
            </h1>
            <p className="mt-2 max-w-xl font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              Consulta la cedula, valida datos de padron y completa contacto territorial.
            </p>
          </div>
          <div className="w-fit rounded-panel border border-neutral-200 bg-neutral-50 px-3 py-2 font-body text-sm font-black text-neutral-700 dark:border-brand-line dark:bg-black/20 dark:text-orange-50/80">
            Fase 1
          </div>
        </div>

        <CedulaLookupField
          error={errors.cedula?.message}
          onLookup={handleLookup}
          register={register("cedula", { onChange: handleCedulaChange })}
          status={padronLookup.status}
        />

        {padronLookup.error ? (
          <div className="flex items-center gap-2 rounded-panel border border-red-300/50 bg-red-50 px-4 py-3 font-body text-sm font-bold text-red-800 dark:border-red-300/30 dark:bg-red-500/10 dark:text-red-100">
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

        <div className="grid gap-3 border-t border-neutral-200 pt-5 sm:grid-cols-[1fr_auto] sm:items-center dark:border-brand-line">
          <div className="min-h-6 font-body text-sm font-semibold">
            {saveStatus === "saved" ? (
              <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-200">
                <CheckCircle2 aria-hidden="true" size={18} strokeWidth={2.6} />
                Registro preparado en modo local.
              </span>
            ) : (
              <span className="text-neutral-600 dark:text-orange-50/[0.65]">
                Sesion autenticada lista para conectar inserts a Supabase.
              </span>
            )}
          </div>

          <Button
            className="w-full sm:min-w-56"
            icon={<Save aria-hidden="true" size={18} strokeWidth={2.8} />}
            isLoading={isSubmitting}
            type="submit"
          >
            Guardar registro
          </Button>
        </div>
      </form>
    </section>
  );
}

export default RegistroVotantePage;
