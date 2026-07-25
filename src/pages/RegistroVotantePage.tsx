import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Filter,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  type ColumnFiltersState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CandidatoSelect from "../components/form/CandidatoSelect";
import CedulaLookupField from "../components/form/CedulaLookupField";
import LocationPickerMap from "../components/form/LocationPickerMap";
import PadronReadonlyFields from "../components/form/PadronReadonlyFields";
import PhoneField from "../components/form/PhoneField";
import AlertModal, { type AlertModalDetail } from "../components/ui/AlertModal";
import Button from "../components/ui/Button";
import DataGrid from "../components/ui/DataGrid";
import SuccessModal, { type SuccessModalDetail } from "../components/ui/SuccessModal";
import TextInput from "../components/ui/TextInput";
import { PARAGUAY_DEPARTMENTS, getParaguayCitiesByDepartment } from "../data/paraguayTerritories";
import { usePadronLookup } from "../hooks/usePadronLookup";
import { filterCandidatesByElectionRole } from "../lib/candidateCargo";
import { filterCandidatosForProfile, filterCandidatosForVoter, territoriesMatch } from "../lib/candidateTerritory";
import { listarCandidatos } from "../lib/candidatosApi";
import { listarUserProfiles } from "../lib/userProfilesApi";
import {
  crearVotoSeguroSnapshot,
  listarVotoSeguroSnapshots,
  registrarNotificacionWhatsapp,
  VotoSeguroDuplicateError,
  type VotoSeguroRecord,
} from "../lib/votoSeguroApi";
import { useAppStore } from "../store/appStore";
import type { Candidato } from "../types/candidato";
import type { UserProfile } from "../types/userProfile";
import type { RegistroVotanteFormValues } from "../types/votante";

const registroSchema = z.object({
  cedula: z.string().regex(/^\d{5,10}$/, "Ingresa una cedula numerica valida."),
  nombreApellido: z.string().min(3, "Ingresa nombre y apellido."),
  departamento: z.string().min(1, "Consulta una cedula para completar este dato."),
  distrito: z.string().min(1, "Consulta una cedula para completar este dato."),
  zona: z.string().min(1, "Consulta una cedula para completar este dato."),
  local: z.string().min(1, "Consulta una cedula para completar este dato."),
  telefono: z.string().regex(/^09\d{8}$/, "Usa el formato paraguayo 09XXXXXXXX."),
  candidatoConcejalId: z.string().min(1, "Selecciona un candidato a concejal."),
  candidatoIntendenteId: z.string(),
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

const registroDefaultValues: RegistroVotanteFormValues = {
  candidatoConcejalId: "",
  candidatoIntendenteId: "",
  cedula: "",
  departamento: "",
  distrito: "",
  local: "",
  nombreApellido: "",
  telefono: "",
  ubicacion: undefined,
  zona: "",
};

const initialGridFilters = {
  candidatoId: "",
  cedula: "",
  ciudad: "",
  departamento: "",
  dateFrom: "",
  dateTo: "",
  loadedBy: "",
  localidad: "",
  nombre: "",
  notificacion: "TODOS",
  telefono: "",
};

interface SuccessAlertState {
  details: SuccessModalDetail[];
  summary: string;
  title: string;
}

interface DuplicateAlertState {
  details: AlertModalDetail[];
  message: string;
  title: string;
}

type GridFilters = typeof initialGridFilters;

function RegistroVotantePage() {
  const padronLookup = usePadronLookup();
  const profile = useAppStore((state) => state.profile);
  const user = useAppStore((state) => state.user);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidateFeedback, setCandidateFeedback] = useState<string | null>(null);
  const [gridFeedback, setGridFeedback] = useState("Cargas recientes listas.");
  const [gridFilters, setGridFilters] = useState<GridFilters>(initialGridFilters);
  const [isLoadingCandidatos, setIsLoadingCandidatos] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [records, setRecords] = useState<VotoSeguroRecord[]>([]);
  const [duplicateAlert, setDuplicateAlert] = useState<DuplicateAlertState | null>(null);
  const [municipalityAlert, setMunicipalityAlert] = useState<DuplicateAlertState | null>(null);
  const [notifyingRecordId, setNotifyingRecordId] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState("Sesion autenticada lista para guardar.");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [successAlert, setSuccessAlert] = useState<SuccessAlertState | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

  const isAdmin = profile?.role === "admin";

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset: resetRegistroForm,
    setError,
    setValue,
    trigger,
    watch,
  } = useForm<RegistroVotanteFormValues>({
    defaultValues: registroDefaultValues,
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
  const candidatosParaVotante = useMemo(
    () =>
      filterCandidatosForVoter(candidatos, {
        departamento: padronValues.departamento,
        distrito: padronValues.distrito,
      }),
    [candidatos, padronValues.departamento, padronValues.distrito],
  );
  const candidatosConcejal = useMemo(
    () => filterCandidatesByElectionRole(candidatosParaVotante, "concejal"),
    [candidatosParaVotante],
  );
  const candidatosIntendente = useMemo(
    () => filterCandidatesByElectionRole(candidatosParaVotante, "intendente"),
    [candidatosParaVotante],
  );
  const hasIntendenteOptions = candidatosIntendente.length > 0;
  const municipalityMismatch = Boolean(
    profile?.role === "referente" &&
      padronLookup.data &&
      (!territoriesMatch(padronLookup.data.departamento, profile.departamento) ||
        !territoriesMatch(padronLookup.data.distrito, profile.ciudad)),
  );

  const loadVotoSeguroRecords = useCallback(
    async (filtersToApply: GridFilters) => {
      setIsLoadingRecords(true);

      try {
        const data = await listarVotoSeguroSnapshots({
          candidatoId: filtersToApply.candidatoId || undefined,
          cedula: filtersToApply.cedula || undefined,
          ciudad: filtersToApply.ciudad || undefined,
          departamento: filtersToApply.departamento || undefined,
          dateFrom: filtersToApply.dateFrom || undefined,
          dateTo: filtersToApply.dateTo || undefined,
          fueNotificado:
            filtersToApply.notificacion === "NOTIFICADOS"
              ? true
              : filtersToApply.notificacion === "PENDIENTES"
              ? false
              : undefined,
          loadedBy: isAdmin ? filtersToApply.loadedBy || undefined : user?.id,
          loadedByLocalidad: isAdmin ? filtersToApply.localidad || undefined : undefined,
          nombre: filtersToApply.nombre || undefined,
          telefono: filtersToApply.telefono || undefined,
        });
        setRecords(data);
        setGridFeedback(data.length ? `${data.length} cargas encontradas.` : "No hay cargas con esos filtros.");
      } catch (error) {
        setGridFeedback(error instanceof Error ? error.message : "No se pudo cargar la grilla.");
      } finally {
        setIsLoadingRecords(false);
      }
    },
    [isAdmin, user?.id],
  );

  const markDirty = () => {
    setSaveStatus("idle");
    setSaveFeedback("Cambios pendientes de guardar.");
  };

  useEffect(() => {
    let isMounted = true;

    async function loadCandidatos() {
      setIsLoadingCandidatos(true);

      try {
        const data = await listarCandidatos();

        if (isMounted) {
          const visibleCandidates = filterCandidatosForProfile(data, profile).filter(
            (candidato) => candidato.activo,
          );
          setCandidatos(visibleCandidates);
          setCandidateFeedback(
            visibleCandidates.length
              ? null
              : "No hay candidatos activos para tu territorio operativo.",
          );
        }
      } catch (error) {
        if (isMounted) {
          setCandidateFeedback(error instanceof Error ? error.message : "No se pudo cargar candidatos.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCandidatos(false);
        }
      }
    }

    loadCandidatos();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  useEffect(() => {
    void loadVotoSeguroRecords(initialGridFilters);
  }, [loadVotoSeguroRecords]);

  useEffect(() => {
    if (!isAdmin) {
      setUserProfiles([]);
      return;
    }

    let isMounted = true;

    async function loadUserProfiles() {
      try {
        const data = await listarUserProfiles();

        if (isMounted) {
          setUserProfiles(data);
        }
      } catch {
        if (isMounted) {
          setUserProfiles([]);
        }
      }
    }

    void loadUserProfiles();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!padronLookup.data) {
      return;
    }

    setValue("nombreApellido", padronLookup.data.nombreApellido, { shouldValidate: true });
    setValue("departamento", padronLookup.data.departamento, { shouldValidate: true });
    setValue("distrito", padronLookup.data.distrito, { shouldValidate: true });
    setValue("zona", padronLookup.data.zona, { shouldValidate: true });
    setValue("local", padronLookup.data.local, { shouldValidate: true });
    setValue("candidatoConcejalId", "", { shouldValidate: false });
    setValue("candidatoIntendenteId", "", { shouldValidate: false });
    setSaveFeedback("Padron cargado. El nombre queda bloqueado para preservar el snapshot.");
    setSaveStatus("idle");
  }, [padronLookup.data, setValue]);

  useEffect(() => {
    if (!municipalityMismatch) {
      return;
    }

    setValue("candidatoConcejalId", "", { shouldValidate: false });
    setValue("candidatoIntendenteId", "", { shouldValidate: false });
    setMunicipalityAlert({
      details: [
        { label: "Cedula", value: padronLookup.data?.cedula || cedula || "-" },
        {
          label: "Pertenece a",
          value: `${padronLookup.data?.departamento || "-"} / ${padronLookup.data?.distrito || "-"}`,
        },
        {
          label: "Municipio operativo",
          value: `${profile?.departamento || "-"} / ${profile?.ciudad || "-"}`,
        },
      ],
      message: "Cedula ingresada no pertenece al municipio.",
      title: "Municipio incorrecto",
    });
    setSaveFeedback("Cedula ingresada no pertenece al municipio.");
    setSaveStatus("idle");
  }, [cedula, municipalityMismatch, padronLookup.data, profile?.ciudad, profile?.departamento, setValue]);

  const handleLookup = async () => {
    const validCedula = await trigger("cedula");

    if (!validCedula) {
      return;
    }

    await padronLookup.lookup(cedula);
  };

  const handleLocationChange = (location: NonNullable<RegistroVotanteFormValues["ubicacion"]>) => {
    setValue("ubicacion", location, { shouldDirty: true, shouldValidate: true });
    markDirty();
  };

  const handleCedulaChange = () => {
    setSaveStatus("idle");
    setSuccessAlert(null);
    setMunicipalityAlert(null);
    padronLookup.reset();
    setSaveFeedback("Consulta la cedula para completar el padron.");
    setValue("nombreApellido", "", { shouldValidate: false });
    setValue("candidatoConcejalId", "", { shouldValidate: false });
    setValue("candidatoIntendenteId", "", { shouldValidate: false });

    if (Object.values(padronValues).every(Boolean)) {
      setValue("departamento", emptyPadron.departamento, { shouldValidate: false });
      setValue("distrito", emptyPadron.distrito, { shouldValidate: false });
      setValue("zona", emptyPadron.zona, { shouldValidate: false });
      setValue("local", emptyPadron.local, { shouldValidate: false });
    }
  };

  const handleFilterChange =
    (field: keyof GridFilters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (field === "departamento") {
        setGridFilters((currentFilters) => ({
          ...currentFilters,
          ciudad: "",
          departamento: event.target.value,
        }));
        return;
      }

      setGridFilters((currentFilters) => ({
        ...currentFilters,
        [field]: event.target.value,
      }));
    };

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadVotoSeguroRecords(gridFilters);
  };

  const handleClearFilters = () => {
    setGridFilters(initialGridFilters);
    void loadVotoSeguroRecords(initialGridFilters);
  };

  const handleNotifyWhatsapp = async (record: VotoSeguroRecord) => {
    let whatsappUrl = "";

    try {
      whatsappUrl = buildWhatsappUrl(record);
    } catch (error) {
      setGridFeedback(error instanceof Error ? error.message : "No se pudo preparar WhatsApp.");
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setNotifyingRecordId(record.id);
    setGridFeedback("WhatsApp abierto. Registrando notificacion.");

    try {
      const updatedRecord = await registrarNotificacionWhatsapp(record, user?.id);
      setRecords((currentRecords) =>
        currentRecords.map((currentRecord) =>
          currentRecord.id === updatedRecord.id ? updatedRecord : currentRecord,
        ),
      );
      setGridFeedback(record.fueNotificado ? "Renotificacion registrada." : "Notificacion registrada.");
    } catch (error) {
      setGridFeedback(
        error instanceof Error
          ? error.message
          : "WhatsApp se abrio, pero no se pudo registrar la notificacion.",
      );
    } finally {
      setNotifyingRecordId(null);
    }
  };

  const handleCloseMunicipalityAlert = () => {
    setMunicipalityAlert(null);
    resetRegistroForm(registroDefaultValues);
    padronLookup.reset();
    setSaveFeedback("Consulta la cedula para completar el padron.");
    setSaveStatus("idle");
  };

  const onSubmit = async (values: RegistroVotanteFormValues) => {
    if (municipalityMismatch) {
      setSaveStatus("idle");
      setMunicipalityAlert({
        details: [
          { label: "Cedula", value: padronLookup.data?.cedula || values.cedula },
          {
            label: "Pertenece a",
            value: `${padronLookup.data?.departamento || "-"} / ${padronLookup.data?.distrito || "-"}`,
          },
          {
            label: "Municipio operativo",
            value: `${profile?.departamento || "-"} / ${profile?.ciudad || "-"}`,
          },
        ],
        message: "Cedula ingresada no pertenece al municipio.",
        title: "Municipio incorrecto",
      });
      setSaveFeedback("Cedula ingresada no pertenece al municipio.");
      return;
    }

    const candidatoConcejal = candidatosConcejal.find((item) => item.id === values.candidatoConcejalId);
    const candidatoIntendente = values.candidatoIntendenteId
      ? candidatosIntendente.find((item) => item.id === values.candidatoIntendenteId)
      : null;

    if (!candidatoConcejal) {
      setSaveStatus("idle");
      setSaveFeedback("Selecciona un candidato a concejal valido para el territorio del votante.");
      return;
    }

    if (hasIntendenteOptions && !values.candidatoIntendenteId) {
      setError("candidatoIntendenteId", {
        message: "Selecciona un candidato a intendente para este distrito.",
        type: "required",
      });
      setSaveStatus("idle");
      setSaveFeedback("Este distrito tiene candidatos a intendente; selecciona uno para continuar.");
      return;
    }

    if (values.candidatoIntendenteId && !candidatoIntendente) {
      setSaveStatus("idle");
      setSaveFeedback("Selecciona un candidato a intendente valido para el territorio del votante.");
      return;
    }

    try {
      const saved = await crearVotoSeguroSnapshot({
        candidatoConcejal,
        candidatoIntendente,
        padron: padronLookup.data,
        profile,
        user,
        values,
      });

      setSaveStatus("saved");
      setSuccessAlert({
        details: [
          { label: "Votante", value: values.nombreApellido },
          ...(candidatoIntendente
            ? [{ label: "Intendente", value: candidatoIntendente.nombreCandidato }]
            : []),
          { label: "Concejal", value: candidatoConcejal.nombreCandidato },
          { label: "Carga", value: `${formatDate(saved.created_at)} - ID ${shortId(saved.id)}` },
        ],
        summary: "La carga quedo guardada y se actualizo la grilla de Voto Seguro.",
        title: "Voto bien cargado",
      });
      resetRegistroForm(registroDefaultValues);
      padronLookup.reset();
      setSaveFeedback("Carga guardada. Listo para registrar otro votante.");
      await loadVotoSeguroRecords(gridFilters);
    } catch (error) {
      if (error instanceof VotoSeguroDuplicateError) {
        const duplicate = error.duplicate;

        setSaveStatus("idle");
        setDuplicateAlert({
          details: [
            { label: "Cedula", value: duplicate.cedula },
            { label: "Votante", value: duplicate.nombreApellido },
            { label: "Referente", value: duplicate.loadedByNombre },
            { label: "Fecha de carga", value: formatDate(duplicate.createdAt) },
            {
              label: "Territorio del referente",
              value: [duplicate.loadedByDepartamento, duplicate.loadedByCiudad, duplicate.loadedByLocalidad]
                .filter((value) => value && value !== "-")
                .join(" / ") || "-",
            },
          ],
          message: "Esta cedula ya tiene una carga activa en Voto Seguro.",
          title: "Cedula ya cargada",
        });
        setSaveFeedback("La cedula ya fue cargada anteriormente.");
        return;
      }

      setSaveStatus("idle");
      setSaveFeedback(error instanceof Error ? error.message : "No se pudo guardar Voto Seguro.");
    }
  };

  return (
    <section className="space-y-4">
      {successAlert ? (
        <SuccessModal
          details={successAlert.details}
          onClose={() => setSuccessAlert(null)}
          summary={successAlert.summary}
          title={successAlert.title}
        />
      ) : null}

      {duplicateAlert ? (
        <AlertModal
          details={duplicateAlert.details}
          message={duplicateAlert.message}
          onClose={() => setDuplicateAlert(null)}
          title={duplicateAlert.title}
        />
      ) : null}

      {municipalityAlert ? (
        <AlertModal
          details={municipalityAlert.details}
          eyebrow="Territorio no permitido"
          message={municipalityAlert.message}
          onClose={handleCloseMunicipalityAlert}
          title={municipalityAlert.title}
          tone="danger"
        />
      ) : null}

      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.88] p-4 shadow-panel backdrop-blur sm:p-5 lg:p-7 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 border-b border-neutral-200 pb-5 sm:grid-cols-[1fr_auto] sm:items-start dark:border-brand-line">
            <div>
              <p className="font-body text-xs font-black uppercase text-brand-orange">
                Voto Seguro
              </p>
              <h1 className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white">
                Carga de Voto Seguro
              </h1>
              <p className="mt-2 max-w-xl font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
                Busca al votante en el padron, valida sus datos y asocialo al candidato.
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
            readOnly
            {...register("nombreApellido")}
          />

          <PadronReadonlyFields {...padronValues} />

          <div className="grid gap-4 md:grid-cols-2">
            <PhoneField
              error={errors.telefono?.message}
              register={register("telefono", { onChange: markDirty })}
            />
            {hasIntendenteOptions ? (
              <CandidatoSelect
                candidatos={candidatosIntendente}
                emptyLabel="Sin candidatos a intendente"
                error={errors.candidatoIntendenteId?.message}
                id="candidatoIntendenteId"
                isLoading={isLoadingCandidatos}
                label="Intendente"
                register={register("candidatoIntendenteId", { onChange: markDirty })}
              />
            ) : null}
            <CandidatoSelect
              candidatos={candidatosConcejal}
              emptyLabel={
                padronValues.departamento && padronValues.distrito
                  ? "Sin concejales para este territorio"
                  : "Consulta una cedula primero"
              }
              error={errors.candidatoConcejalId?.message}
              id="candidatoConcejalId"
              isLoading={isLoadingCandidatos}
              label="Concejal / Titular"
              register={register("candidatoConcejalId", { onChange: markDirty })}
            />
          </div>

          {candidateFeedback ? (
            <div className="flex items-center gap-2 rounded-panel border border-brand-orange/40 bg-brand-orange/10 px-4 py-3 font-body text-sm font-bold text-brand-ink dark:text-orange-50">
              <AlertCircle aria-hidden="true" size={18} strokeWidth={2.6} />
              {candidateFeedback}
            </div>
          ) : null}

          {padronValues.departamento && padronValues.distrito && !isLoadingCandidatos && candidatosParaVotante.length === 0 ? (
            <div className="flex items-center gap-2 rounded-panel border border-brand-orange/40 bg-brand-orange/10 px-4 py-3 font-body text-sm font-bold text-brand-ink dark:text-orange-50">
              <AlertCircle aria-hidden="true" size={18} strokeWidth={2.6} />
              No hay candidatos activos para {padronValues.departamento} / {padronValues.distrito}.
            </div>
          ) : null}

          {padronValues.departamento && padronValues.distrito && !isLoadingCandidatos && candidatosParaVotante.length > 0 && !hasIntendenteOptions ? (
            <div className="flex items-center gap-2 rounded-panel border border-neutral-200 bg-neutral-50 px-4 py-3 font-body text-sm font-bold text-neutral-700 dark:border-brand-line dark:bg-white/[0.06] dark:text-orange-50/75">
              <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.6} />
              Este distrito no tiene candidatos a intendente cargados; se registra solo Concejal/Titular.
            </div>
          ) : null}

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
                  {saveFeedback}
                </span>
              ) : (
                <span className="text-neutral-600 dark:text-orange-50/[0.65]">
                  {saveFeedback}
                </span>
              )}
            </div>

            <Button
              className="w-full sm:min-w-56"
              icon={<Save aria-hidden="true" size={18} strokeWidth={2.8} />}
              isLoading={isSubmitting}
              type="submit"
            >
              Guardar Voto Seguro
            </Button>
          </div>
        </form>
      </section>

      <VotoSeguroGrid
        candidatos={candidatos}
        feedback={gridFeedback}
        filters={gridFilters}
        isLoading={isLoadingRecords}
        onClearFilters={handleClearFilters}
        onFilterChange={handleFilterChange}
        onNotifyWhatsapp={handleNotifyWhatsapp}
        onRefresh={() => void loadVotoSeguroRecords(gridFilters)}
        onSubmitFilters={handleFilterSubmit}
        notifyingRecordId={notifyingRecordId}
        records={records}
        isAdmin={isAdmin}
        userProfiles={userProfiles}
      />
    </section>
  );
}

interface VotoSeguroGridProps {
  candidatos: Candidato[];
  feedback: string;
  filters: GridFilters;
  isAdmin: boolean;
  isLoading: boolean;
  onClearFilters: () => void;
  onFilterChange: (field: keyof GridFilters) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onNotifyWhatsapp: (record: VotoSeguroRecord) => void;
  onRefresh: () => void;
  onSubmitFilters: (event: FormEvent<HTMLFormElement>) => void;
  notifyingRecordId: string | null;
  records: VotoSeguroRecord[];
  userProfiles: UserProfile[];
}

function VotoSeguroGrid({
  candidatos,
  feedback,
  filters,
  isAdmin,
  isLoading,
  onClearFilters,
  onFilterChange,
  onNotifyWhatsapp,
  onRefresh,
  onSubmitFilters,
  notifyingRecordId,
  records,
  userProfiles,
}: VotoSeguroGridProps) {
  const cityOptions = getParaguayCitiesByDepartment(filters.departamento);
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const activeFilters: ColumnFiltersState = [];

    if (filters.cedula.trim() || filters.nombre.trim() || filters.telefono.trim()) {
      activeFilters.push({
        id: "votante",
        value: {
          cedula: filters.cedula,
          nombre: filters.nombre,
          telefono: filters.telefono,
        },
      });
    }

    if (filters.notificacion !== "TODOS") {
      activeFilters.push({
        id: "notificacion",
        value: filters.notificacion,
      });
    }

    return activeFilters;
  }, [filters.cedula, filters.nombre, filters.notificacion, filters.telefono]);

  const columns = useMemo<ColumnDef<VotoSeguroRecord>[]>(
    () => {
      const visibleColumns: ColumnDef<VotoSeguroRecord>[] = [
      {
        id: "votante",
        accessorFn: (record) => `${record.nombreApellido} ${record.cedula} ${record.telefono}`,
        header: "Votante",
        filterFn: (row, _columnId, filterValue) => matchesVoterColumnFilter(row.original, filterValue),
        cell: ({ row }) => (
          <div className="min-w-52">
            <p className="font-display text-lg leading-tight text-brand-ink dark:text-white">
              {row.original.nombreApellido}
            </p>
            <p className="mt-1 font-body text-xs font-black uppercase text-brand-orange">
              Cedula {row.original.cedula} - {row.original.telefono}
            </p>
          </div>
        ),
      },
      ...(isAdmin
        ? [
            {
              id: "loadedBy",
              header: "Usuario",
              cell: ({ row }) => loadedByLabel(row.original),
            } satisfies ColumnDef<VotoSeguroRecord>,
          ]
        : []),
      {
        accessorKey: "candidatoNombre",
        header: "Candidatos",
        cell: ({ row }) => (
          <CandidateStack record={row.original} />
        ),
      },
      {
        accessorKey: "departamento",
        header: "Departamento",
        cell: ({ row }) => row.original.departamento || "-",
      },
      {
        accessorKey: "distrito",
        header: "Ciudad",
        cell: ({ row }) => row.original.distrito || "-",
      },
      {
        id: "local",
        header: "Local",
        cell: ({ row }) => row.original.localVotacion || row.original.local || "-",
      },
      {
        id: "mesaOrden",
        header: "Mesa / Orden",
        cell: ({ row }) => mesaOrdenLabel(row.original),
      },
      {
        id: "notificacion",
        accessorFn: (record) => (record.fueNotificado ? "NOTIFICADOS" : "PENDIENTES"),
        header: "Notificacion",
        filterFn: (row, _columnId, filterValue) => matchesNotificationColumnFilter(row.original, filterValue),
        cell: ({ row }) => <NotificationStatus record={row.original} />,
      },
      {
        accessorKey: "createdAt",
        header: "Carga",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <WhatsappNotifyButton
            isLoading={notifyingRecordId === row.original.id}
            onClick={() => onNotifyWhatsapp(row.original)}
            record={row.original}
          />
        ),
      },
      ];

      return visibleColumns;
    },
    [isAdmin, notifyingRecordId, onNotifyWhatsapp],
  );

  return (
    <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.88] p-4 shadow-panel backdrop-blur sm:p-5 lg:p-7 dark:border-brand-line dark:bg-neutral-900/[0.92]">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="font-body text-xs font-black uppercase text-brand-orange">Grilla</p>
          <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink dark:text-white">
            Voto Seguro cargado
          </h2>
          <p className="mt-2 font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
            {feedback}
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
          onClick={onRefresh}
          type="button"
        >
          <RefreshCcw aria-hidden="true" size={16} strokeWidth={2.7} />
          Actualizar
        </button>
      </div>

      <form className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmitFilters}>
        {isAdmin ? (
          <>
            <FilterField label="Usuario">
              <select
                className={filterInputClass()}
                onChange={onFilterChange("loadedBy")}
                value={filters.loadedBy}
              >
                <option value="">Todos</option>
                {userProfiles.map((userProfile) => (
                  <option key={userProfile.id} value={userProfile.authUserId}>
                    {userProfile.nombreApellido} - {userProfile.cedula}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Localidad">
              <input
                className={filterInputClass()}
                onChange={onFilterChange("localidad")}
                placeholder="Filtrar localidad"
                value={filters.localidad}
              />
            </FilterField>
          </>
        ) : (
          <div className="flex min-h-12 items-center gap-2 rounded-panel border border-emerald-300 bg-emerald-50 px-3 py-2 font-body text-sm font-black uppercase text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-100">
            <ShieldCheck aria-hidden="true" size={16} strokeWidth={2.7} />
            Mis cargas
          </div>
        )}

        <FilterField label="Nombre">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange"
            size={17}
            strokeWidth={2.6}
          />
          <input
            className={filterInputClass("pl-10")}
            onChange={onFilterChange("nombre")}
            placeholder="Nombre del votante"
            type="search"
            value={filters.nombre}
          />
        </FilterField>

        <FilterField label="Cedula">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange"
            size={17}
            strokeWidth={2.6}
          />
          <input
            className={filterInputClass("pl-10")}
            inputMode="numeric"
            onChange={onFilterChange("cedula")}
            placeholder="Buscar cedula"
            type="search"
            value={filters.cedula}
          />
        </FilterField>

        <FilterField label="Telefono">
          <Phone
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange"
            size={17}
            strokeWidth={2.6}
          />
          <input
            className={filterInputClass("pl-10")}
            inputMode="tel"
            onChange={onFilterChange("telefono")}
            placeholder="09XXXXXXXX"
            type="search"
            value={filters.telefono}
          />
        </FilterField>

        <FilterField label="Notificacion">
          <BellRing
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange"
            size={17}
            strokeWidth={2.6}
          />
          <select
            className={filterInputClass("pl-10")}
            onChange={onFilterChange("notificacion")}
            value={filters.notificacion}
          >
            <option value="TODOS">Todos</option>
            <option value="PENDIENTES">Pendientes</option>
            <option value="NOTIFICADOS">Notificados</option>
          </select>
        </FilterField>

        <FilterField label="Departamento">
          <select
            className={filterInputClass()}
            onChange={onFilterChange("departamento")}
            value={filters.departamento}
          >
            <option value="">Todos</option>
            {PARAGUAY_DEPARTMENTS.map((department) => (
              <option key={department.code} value={department.name}>
                {department.name}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Ciudad">
          <select
            className={filterInputClass()}
            disabled={!filters.departamento}
            onChange={onFilterChange("ciudad")}
            value={filters.ciudad}
          >
            <option value="">
              {filters.departamento ? "Todas" : "Selecciona departamento"}
            </option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Candidato">
          <select
            className={filterInputClass()}
            onChange={onFilterChange("candidatoId")}
            value={filters.candidatoId}
          >
            <option value="">Todos</option>
            {candidatos.map((candidato) => (
              <option key={candidato.id} value={candidato.id}>
                {candidato.nombreCandidato}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Desde">
          <CalendarDays
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange"
            size={17}
            strokeWidth={2.6}
          />
          <input
            className={filterInputClass("pl-10")}
            onChange={onFilterChange("dateFrom")}
            type="date"
            value={filters.dateFrom}
          />
        </FilterField>

        <FilterField label="Hasta">
          <CalendarDays
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange"
            size={17}
            strokeWidth={2.6}
          />
          <input
            className={filterInputClass("pl-10")}
            onChange={onFilterChange("dateTo")}
            type="date"
            value={filters.dateTo}
          />
        </FilterField>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-1">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-panel bg-brand-orange px-4 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:bg-orange-500"
            type="submit"
          >
            <Filter aria-hidden="true" size={16} strokeWidth={2.7} />
            Filtrar
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-panel border border-neutral-300 bg-white px-4 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
            onClick={onClearFilters}
            type="button"
          >
            Limpiar
          </button>
        </div>
      </form>

      <div className="mt-5">
        <DataGrid
          columnFilters={columnFilters}
          columns={columns}
          data={records}
          emptyMessage="No hay registros para mostrar."
          getRowKey={(record) => record.id}
          isLoading={isLoading}
          loadingMessage="Cargando Voto Seguro"
          renderMobileCard={(record) => (
            <VotoSeguroCard
              isNotifying={notifyingRecordId === record.id}
              onNotifyWhatsapp={onNotifyWhatsapp}
              record={record}
            />
          )}
        />
      </div>
    </section>
  );
}

interface VotoSeguroCardProps {
  isNotifying: boolean;
  onNotifyWhatsapp: (record: VotoSeguroRecord) => void;
  record: VotoSeguroRecord;
}

function VotoSeguroCard({ isNotifying, onNotifyWhatsapp, record }: VotoSeguroCardProps) {
  return (
    <article className="rounded-panel border border-neutral-200 bg-white/75 p-4 dark:border-brand-line dark:bg-black/[0.16]">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight text-brand-ink dark:text-white">
            {record.nombreApellido}
          </p>
          <p className="mt-1 font-body text-sm font-black uppercase text-brand-orange">
            Cedula {record.cedula} - {record.telefono}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-panel border border-emerald-300 bg-emerald-50 px-3 py-2 font-body text-xs font-black uppercase text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <ShieldCheck aria-hidden="true" size={14} strokeWidth={2.7} />
          {record.estado}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-neutral-700 dark:text-orange-50/80 md:grid-cols-2 xl:grid-cols-4">
        <GridMetric label="Intendente" value={intendenteLabel(record)} />
        <GridMetric label="Concejal" value={concejalLabel(record)} />
        <GridMetric label="Territorio" value={territoryLabel(record)} />
        <GridMetric label="Local" value={record.localVotacion || record.local || "-"} />
        <GridMetric label="Mesa / Orden" value={mesaOrdenLabel(record)} />
        <NotificationStatus record={record} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <p className="font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
          {formatDate(record.createdAt)} - {loadedByLabel(record)}
        </p>
        <WhatsappNotifyButton
          className="w-full sm:w-auto"
          isLoading={isNotifying}
          onClick={() => onNotifyWhatsapp(record)}
          record={record}
        />
      </div>
    </article>
  );
}

interface GridMetricProps {
  label: string;
  value: string;
}

function GridMetric({ label, value }: GridMetricProps) {
  return (
    <div className="min-w-0 rounded-panel border border-neutral-200 bg-white/70 p-3 dark:border-brand-line dark:bg-white/[0.04]">
      <p className="font-body text-[0.68rem] font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
        {label}
      </p>
      <p className="mt-1 truncate font-body text-sm font-black text-brand-ink dark:text-white">
        {value}
      </p>
    </div>
  );
}

interface CandidateStackProps {
  record: VotoSeguroRecord;
}

function CandidateStack({ record }: CandidateStackProps) {
  return (
    <div className="min-w-56 space-y-1.5">
      {record.intendenteNombre ? (
        <p className="font-body text-sm font-black text-brand-ink dark:text-white">
          <span className="text-brand-orange">Intendente:</span> {intendenteLabel(record)}
        </p>
      ) : null}
      <p className="font-body text-sm font-black text-brand-ink dark:text-white">
        <span className="text-brand-orange">Concejal:</span> {concejalLabel(record)}
      </p>
    </div>
  );
}

interface NotificationStatusProps {
  record: VotoSeguroRecord;
}

function NotificationStatus({ record }: NotificationStatusProps) {
  const statusClasses = record.fueNotificado
    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-100"
    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-amber-100";
  const dateLabel = record.fechaRenotificacion
    ? `Renotificado ${formatDate(record.fechaRenotificacion)}`
    : record.fechaNotificacion
    ? `Notificado ${formatDate(record.fechaNotificacion)}`
    : "Sin aviso";

  return (
    <div className="min-w-40 space-y-1.5">
      <span
        className={[
          "inline-flex w-fit items-center gap-2 rounded-panel border px-3 py-2 font-body text-xs font-black uppercase",
          statusClasses,
        ].join(" ")}
      >
        <BellRing aria-hidden="true" size={14} strokeWidth={2.7} />
        {record.fueNotificado ? "Notificado" : "Pendiente"}
      </span>
      <p className="font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
        {dateLabel}
      </p>
    </div>
  );
}

interface WhatsappNotifyButtonProps {
  className?: string;
  isLoading: boolean;
  onClick: () => void;
  record: VotoSeguroRecord;
}

function WhatsappNotifyButton({
  className = "",
  isLoading,
  onClick,
  record,
}: WhatsappNotifyButtonProps) {
  const label = record.fueNotificado ? "Renotificar" : "WhatsApp";

  return (
    <button
      aria-label={`${record.fueNotificado ? "Renotificar" : "Notificar"} a ${record.nombreApellido} por WhatsApp`}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-panel bg-emerald-500 px-3 py-2 font-body text-sm font-black uppercase text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
      disabled={isLoading}
      onClick={onClick}
      title={record.fueNotificado ? "Renotificar via WhatsApp" : "Notificar via WhatsApp"}
      type="button"
    >
      {isLoading ? (
        <Loader2 aria-hidden="true" className="animate-spin" size={16} strokeWidth={2.7} />
      ) : (
        <MessageCircle aria-hidden="true" size={16} strokeWidth={2.7} />
      )}
      <span>{label}</span>
    </button>
  );
}

interface FilterFieldProps {
  children: ReactNode;
  label: string;
}

function FilterField({ children, label }: FilterFieldProps) {
  return (
    <label className="space-y-2 text-sm font-semibold text-neutral-700 dark:text-orange-50/80">
      <span>{label}</span>
      <div className="relative">{children}</div>
    </label>
  );
}

function filterInputClass(extra = "") {
  return [
    "min-h-12 w-full rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-base font-black text-brand-ink outline-none transition focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 dark:bg-brand-field dark:disabled:bg-white/[0.06] dark:disabled:text-orange-50/45",
    extra,
  ].join(" ");
}

function concejalLabel(record: VotoSeguroRecord) {
  const name = record.concejalNombre ?? record.candidatoNombre;
  const list = record.concejalNumeroLista ?? record.candidatoNumeroLista;

  return `${name} - ${list ? `Lista ${list}` : "Lista -"}`;
}

function intendenteLabel(record: VotoSeguroRecord) {
  if (!record.intendenteNombre) {
    return "Sin intendente";
  }

  return `${record.intendenteNombre} - ${
    record.intendenteNumeroLista ? `Lista ${record.intendenteNumeroLista}` : "Lista -"
  }`;
}

function territoryLabel(record: VotoSeguroRecord) {
  return [record.departamento, record.distrito, record.zona].filter(Boolean).join(" / ") || "-";
}

function mesaOrdenLabel(record: VotoSeguroRecord) {
  const mesa = record.mesa || "-";
  const orden = record.orden || "-";
  return `Mesa ${mesa} - Orden ${orden}`;
}

function loadedByLabel(record: VotoSeguroRecord) {
  const userName = record.loadedByNombre || "Usuario";
  const locality = record.loadedByLocalidad ? ` - ${record.loadedByLocalidad}` : "";

  return `${userName}${locality}`;
}

function matchesVoterColumnFilter(record: VotoSeguroRecord, filterValue: unknown) {
  if (!filterValue || typeof filterValue !== "object") {
    return true;
  }

  const typedFilter = filterValue as { cedula?: string; nombre?: string; telefono?: string };
  const cedulaFilter = normalizeFilterValue(typedFilter.cedula);
  const nombreFilter = normalizeFilterValue(typedFilter.nombre);
  const telefonoFilter = normalizeFilterValue(typedFilter.telefono);

  return (
    (!cedulaFilter || normalizeFilterValue(record.cedula).includes(cedulaFilter)) &&
    (!nombreFilter || normalizeFilterValue(record.nombreApellido).includes(nombreFilter)) &&
    (!telefonoFilter || normalizeFilterValue(record.telefono).includes(telefonoFilter))
  );
}

function matchesNotificationColumnFilter(record: VotoSeguroRecord, filterValue: unknown) {
  if (filterValue === "NOTIFICADOS") {
    return record.fueNotificado;
  }

  if (filterValue === "PENDIENTES") {
    return !record.fueNotificado;
  }

  return true;
}

function buildWhatsappUrl(record: VotoSeguroRecord) {
  const phone = normalizeWhatsappPhone(record.telefono);
  const message = buildWhatsappMessage(record);

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildWhatsappMessage(record: VotoSeguroRecord) {
  const emojis = {
    ballot: "\u{1F5F3}\u{FE0F}",
    heart: "\u{1F9E1}",
    pin: "\u{1F4CD}",
    py: "\u{1F1F5}\u{1F1FE}",
    ticket: "\u{1F39F}\u{FE0F}",
  };
  const local = record.localVotacion || record.local || "tu local de votacion";

  return [
    `${emojis.py} ${record.nombreApellido} - Ya llega el gran dia!! esperamos tu apoyo.`,
    `${emojis.ballot} Candidatos que elegiste: ${candidateNamesForWhatsapp(record)}.`,
    `${emojis.pin} Local: ${local}.`,
    `${emojis.ticket} ${mesaOrdenLabel(record)}.`,
    `${emojis.heart} Gracias por acompanarnos!`,
  ].join("\n");
}

function candidateNamesForWhatsapp(record: VotoSeguroRecord) {
  return [
    record.intendenteNombre ? `Intendente: ${record.intendenteNombre}` : "",
    `Concejal: ${record.concejalNombre ?? record.candidatoNombre}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function normalizeWhatsappPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("595") && digits.length >= 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return `595${digits.slice(1)}`;
  }

  if (digits.startsWith("9") && digits.length === 9) {
    return `595${digits}`;
  }

  throw new Error("El telefono no tiene formato paraguayo valido para WhatsApp.");
}

function normalizeFilterValue(value?: string) {
  return (
    value
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase() ?? ""
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}

export default RegistroVotantePage;
