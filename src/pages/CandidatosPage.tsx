import {
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Edit3,
  ImageUp,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  UserRound,
  UsersRound,
  Vote,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import ConfirmModal from "../components/ui/ConfirmModal";
import DataGrid from "../components/ui/DataGrid";
import SuccessModal, { type SuccessModalDetail } from "../components/ui/SuccessModal";
import {
  actualizarCandidato,
  crearCandidato,
  eliminarCandidato,
  listarCandidatos,
  type CandidatoFormValues,
} from "../lib/candidatosApi";
import { uploadCandidatePhoto } from "../lib/candidatePhotosApi";
import {
  PARAGUAY_DEPARTMENTS,
  findParaguayCityName,
  findParaguayDepartmentName,
  getParaguayCitiesByDepartment,
} from "../data/paraguayTerritories";
import { filterCandidatosForProfile } from "../lib/candidateTerritory";
import { useAppStore } from "../store/appStore";
import type { Candidato } from "../types/candidato";

const initialForm: CandidatoFormValues = {
  nombreCandidato: "",
  tipoCodigo: "PPC",
  cargo: "",
  numeroLista: "",
  localidad: "",
  departamento: "",
  ciudad: "",
  fotoUrl: "",
  observaciones: "",
};

function CandidatosPage() {
  const profile = useAppStore((state) => state.profile);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidato | null>(null);
  const [form, setForm] = useState<CandidatoFormValues>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("Modulo de candidatos listo.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [successAlert, setSuccessAlert] = useState<{
    details: SuccessModalDetail[];
    summary: string;
    title: string;
  } | null>(null);

  const isAdmin = profile?.role === "admin";
  const createdByUser = profile?.nombreApellido ?? "usuario activo";
  const cityOptions = getParaguayCitiesByDepartment(form.departamento);

  useEffect(() => {
    let isMounted = true;

    async function loadCandidatos() {
      setIsLoading(true);

      try {
        const data = await listarCandidatos();

        if (isMounted) {
          const visibleCandidates = filterCandidatosForProfile(data, profile);
          setCandidatos(visibleCandidates);
          setFeedback(
            visibleCandidates.length
              ? isAdmin
                ? "Candidatos cargados."
                : "Candidatos de tu territorio cargados."
              : "Sin candidatos disponibles.",
          );
        }
      } catch (error) {
        if (isMounted) {
          setFeedback(error instanceof Error ? error.message : "No se pudo cargar candidatos.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCandidatos();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, profile]);

  const handleChange =
    (field: keyof CandidatoFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((currentForm) => ({
        ...currentForm,
        ...(field === "departamento" ? { ciudad: "" } : {}),
        [field]: event.target.value,
      }));
      setFeedback("Modificando candidato.");
    };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setFeedback("Formulario limpio.");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdmin) {
      setFeedback("Solo administradores pueden guardar candidatos.");
      return;
    }

    if (!form.nombreCandidato.trim() || !form.numeroLista.trim()) {
      setFeedback("Completa nombre del candidato y numero de lista para guardar.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const updated = await actualizarCandidato(editingId, form);
        setCandidatos((currentCandidatos) =>
          currentCandidatos.map((candidato) =>
            candidato.id === editingId ? updated : candidato,
          ),
        );
        setFeedback("Candidato actualizado.");
        setSuccessAlert({
          details: [
            { label: "Candidato", value: updated.nombreCandidato },
            { label: "Tipo", value: updated.tipo.nombre },
            { label: "Lista", value: updated.numeroLista || "-" },
            { label: "Territorio", value: `${updated.departamento || "-"} / ${updated.ciudad || "-"}` },
          ],
          summary: "El candidato quedo actualizado y disponible segun las reglas de territorio.",
          title: "Candidato actualizado",
        });
      } else {
        const created = await crearCandidato(form, createdByUser);
        setCandidatos((currentCandidatos) => [created, ...currentCandidatos]);
        setFeedback("Candidato creado.");
        setSuccessAlert({
          details: [
            { label: "Candidato", value: created.nombreCandidato },
            { label: "Tipo", value: created.tipo.nombre },
            { label: "Lista", value: created.numeroLista || "-" },
            { label: "Territorio", value: `${created.departamento || "-"} / ${created.ciudad || "-"}` },
          ],
          summary: "El candidato quedo cargado como activo para su territorio.",
          title: "Candidato creado",
        });
      }

      resetForm();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo guardar candidato.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isAdmin) {
      setFeedback("Solo administradores pueden subir fotos.");
      return;
    }

    setIsUploadingPhoto(true);
    setFeedback("Subiendo foto del candidato.");

    try {
      const publicUrl = await uploadCandidatePhoto(file);
      setForm((currentForm) => ({
        ...currentForm,
        fotoUrl: publicUrl,
      }));
      setFeedback("Foto subida. Guarda el candidato para asociarla.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo subir la foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleEdit = (candidato: Candidato) => {
    if (!isAdmin) {
      setFeedback("Solo administradores pueden editar candidatos.");
      return;
    }

    const departamento = findParaguayDepartmentName(candidato.departamento) ?? "";
    const ciudad = findParaguayCityName(departamento, candidato.ciudad) ?? "";

    setEditingId(candidato.id);
    setForm({
      cargo: candidato.cargo ?? "",
      ciudad,
      departamento,
      fotoUrl: candidato.fotoUrl ?? "",
      localidad: candidato.localidad ?? "",
      nombreCandidato: candidato.nombreCandidato,
      numeroLista: candidato.numeroLista ?? "",
      observaciones: candidato.observaciones ?? "",
      tipoCodigo: candidato.tipo.codigo,
    });
    setFeedback(`Editando ${candidato.nombreCandidato}.`);
  };

  const requestDelete = (candidato: Candidato) => {
    if (!isAdmin) {
      setFeedback("Solo administradores pueden eliminar candidatos.");
      return;
    }

    setCandidateToDelete(candidato);
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setFeedback("Solo administradores pueden eliminar candidatos.");
      return;
    }

    if (!candidateToDelete) {
      return;
    }

    setIsSaving(true);

    try {
      await eliminarCandidato(candidateToDelete.id);
      setCandidatos((currentCandidatos) =>
        currentCandidatos.filter((candidato) => candidato.id !== candidateToDelete.id),
      );

      if (editingId === candidateToDelete.id) {
        resetForm();
      }

      setFeedback("Candidato eliminado.");
      setCandidateToDelete(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo eliminar candidato.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<Candidato>[]>(
    () => [
      {
        accessorKey: "nombreCandidato",
        header: "Candidato",
        cell: ({ row }) => (
          <div className="flex min-w-64 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-panel bg-brand-orange text-brand-ink">
              {row.original.fotoUrl ? (
                <img
                  alt={row.original.nombreCandidato}
                  className="h-full w-full object-cover"
                  src={row.original.fotoUrl}
                />
              ) : (
                <Vote aria-hidden="true" size={20} strokeWidth={2.8} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight text-brand-ink dark:text-white">
                {row.original.nombreCandidato}
              </p>
              <p className="mt-1 font-body text-xs font-black uppercase text-brand-orange">
                Lista {row.original.numeroLista || "-"}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ row }) => row.original.tipo.nombre,
      },
      {
        accessorKey: "cargo",
        header: "Cargo",
        cell: ({ row }) => row.original.cargo || "-",
      },
      {
        id: "territorio",
        header: "Territorio",
        cell: ({ row }) => `${row.original.departamento || "-"} / ${row.original.ciudad || "-"}`,
      },
      {
        accessorKey: "localidad",
        header: "Localidad",
        cell: ({ row }) => row.original.localidad || "-",
      },
      {
        accessorKey: "activo",
        header: "Estado",
        cell: ({ row }) => (row.original.activo ? "Activo" : "Inactivo"),
      },
      {
        accessorKey: "createdAt",
        header: "Alta",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      ...(isAdmin
        ? [
            {
              id: "actions",
              header: "Acciones",
              cell: ({ row }) => (
                <div className="flex gap-2">
                  <button
                    aria-label={`Editar ${row.original.nombreCandidato}`}
                    className="rounded-panel border border-neutral-300 bg-white p-2 text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
                    onClick={() => handleEdit(row.original)}
                    type="button"
                  >
                    <Edit3 aria-hidden="true" size={16} strokeWidth={2.6} />
                  </button>
                  <button
                    aria-label={`Eliminar ${row.original.nombreCandidato}`}
                    className="rounded-panel border border-neutral-300 bg-white p-2 text-brand-ink transition hover:border-red-500 hover:text-red-500 dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
                    onClick={() => requestDelete(row.original)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={16} strokeWidth={2.6} />
                  </button>
                </div>
              ),
            } satisfies ColumnDef<Candidato>,
          ]
        : []),
    ],
    [isAdmin],
  );

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

      {candidateToDelete ? (
        <ConfirmModal
          confirmLabel="Eliminar"
          isLoading={isSaving}
          message={`Estas seguro que deseas eliminar a ${candidateToDelete.nombreCandidato}? Si el candidato ya tiene Voto Seguro cargado, el sistema no permitira borrarlo.`}
          onCancel={() => setCandidateToDelete(null)}
          onConfirm={handleDelete}
          title="Eliminar candidato"
        />
      ) : null}

      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Candidatos</p>
            <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink dark:text-white">
              ABM de candidatos
            </h2>
            <p className="mt-2 max-w-2xl font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              El candidato es el dato principal. Lista, localidad y territorio quedan como
              identificadores secundarios hasta migrar departamentos y ciudades a tablas propias.
            </p>
          </div>

          <div className="w-fit rounded-panel border border-neutral-200 bg-white/70 px-3 py-2 font-body text-sm font-black text-neutral-700 dark:border-brand-line dark:bg-black/[0.18] dark:text-white">
            {isLoading ? "Cargando" : `${candidatos.length} registros`}
          </div>
        </div>
      </section>

      {isAdmin ? (
        <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Carga</p>
            <h3 className="font-display text-2xl text-brand-ink dark:text-white">
              {editingId ? "Editar candidato" : "Nuevo candidato"}
            </h3>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
            onClick={resetForm}
            type="button"
          >
            <Plus aria-hidden="true" size={16} strokeWidth={2.7} />
            Nuevo
          </button>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field
            label="Nombre del candidato"
            onChange={handleChange("nombreCandidato")}
            placeholder="Nombre y apellido del candidato"
            value={form.nombreCandidato}
            withAccent
          />
          <Field
            label="Numero de lista"
            onChange={handleChange("numeroLista")}
            placeholder="1"
            value={form.numeroLista}
            withAccent
          />
          <Field
            label="Cargo"
            onChange={handleChange("cargo")}
            placeholder="Intendencia, concejalia..."
            value={form.cargo}
          />
          <SelectField
            label="Tipo"
            onChange={handleChange("tipoCodigo")}
            options={["PPC", "ALIANZA"]}
            placeholder="Seleccionar tipo"
            value={form.tipoCodigo}
          />
          <SelectField
            label="Departamento"
            onChange={handleChange("departamento")}
            options={PARAGUAY_DEPARTMENTS.map((department) => department.name)}
            placeholder="Seleccionar departamento"
            value={form.departamento}
          />
          <SelectField
            disabled={!form.departamento}
            label="Ciudad"
            onChange={handleChange("ciudad")}
            options={cityOptions}
            placeholder={form.departamento ? "Seleccionar ciudad" : "Selecciona departamento"}
            value={form.ciudad}
          />
          <Field
            label="Localidad"
            onChange={handleChange("localidad")}
            placeholder="Barrio, compania o zona"
            value={form.localidad}
          />
          <Field
            className="md:col-span-2"
            label="Foto URL"
            onChange={handleChange("fotoUrl")}
            placeholder="https://..."
            value={form.fotoUrl}
          />

          <div className="rounded-panel border border-neutral-200 bg-white/70 p-3 md:col-span-2 dark:border-brand-line dark:bg-black/[0.16]">
            <div className="grid gap-3 sm:grid-cols-[7rem_1fr] sm:items-center">
              <div className="grid aspect-square place-items-center overflow-hidden rounded-panel border border-neutral-200 bg-neutral-100 dark:border-brand-line dark:bg-brand-coal">
                {form.fotoUrl ? (
                  <img
                    alt="Vista previa del candidato"
                    className="h-full w-full object-cover"
                    src={form.fotoUrl}
                  />
                ) : (
                  <ImageUp aria-hidden="true" className="text-brand-orange" size={34} strokeWidth={2.4} />
                )}
              </div>

              <div className="space-y-2">
                <p className="font-body text-sm font-black uppercase text-neutral-700 dark:text-orange-50/80">
                  Foto del candidato
                </p>
                <p className="font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
                  JPG, PNG o WEBP hasta 5 MB. La URL publica se completa automaticamente.
                </p>
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white">
                  {isUploadingPhoto ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={16} strokeWidth={2.7} />
                  ) : (
                    <ImageUp aria-hidden="true" size={16} strokeWidth={2.7} />
                  )}
                  Subir foto
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isUploadingPhoto}
                    onChange={handlePhotoUpload}
                    type="file"
                  />
                </label>
              </div>
            </div>
          </div>

          <label className="space-y-2 text-sm font-semibold text-neutral-700 md:col-span-2 dark:text-orange-50/80">
            <span>Observaciones</span>
            <textarea
              className="min-h-24 w-full rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-base font-black text-brand-ink outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 dark:bg-brand-field"
              onChange={handleChange("observaciones")}
              placeholder="Detalle interno"
              value={form.observaciones}
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:col-span-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-panel bg-brand-orange px-4 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={16} strokeWidth={2.7} />
              ) : (
                <Save aria-hidden="true" size={16} strokeWidth={2.7} />
              )}
              {editingId ? "Actualizar" : "Guardar"}
            </button>
            <span className="font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              {feedback}
            </span>
          </div>
        </form>
        </section>
      ) : (
        <section className="voto-card rounded-panel border border-brand-orange/40 bg-brand-orange/10 p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line">
          <p className="font-body text-xs font-black uppercase text-brand-orange">Solo lectura</p>
          <h3 className="mt-1 font-display text-2xl text-brand-ink dark:text-white">
            Candidatos disponibles
          </h3>
          <p className="mt-2 font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
            Tu perfil permite consultar candidatos. La administracion queda reservada para administradores.
          </p>
        </section>
      )}

      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Listado</p>
            <h3 className="font-display text-2xl text-brand-ink dark:text-white">
              Candidatos cargados
            </h3>
          </div>
          <UsersRound aria-hidden="true" className="text-brand-orange" size={28} strokeWidth={2.7} />
        </div>

        <div className="mt-5">
          <DataGrid
            columns={columns}
            data={candidatos}
            emptyMessage={
              isAdmin
                ? "Todavia no hay candidatos. Carga el primero arriba."
                : "Todavia no hay candidatos activos para tu territorio."
            }
            getRowKey={(candidato) => candidato.id}
            isLoading={isLoading}
            loadingMessage="Cargando candidatos"
            renderMobileCard={(candidato) => (
              <CandidatoCard
                candidato={candidato}
                isAdmin={isAdmin}
                onDelete={requestDelete}
                onEdit={handleEdit}
              />
            )}
          />
        </div>
      </section>
    </section>
  );
}

interface CandidatoCardProps {
  candidato: Candidato;
  isAdmin: boolean;
  onDelete: (candidato: Candidato) => void;
  onEdit: (candidato: Candidato) => void;
}

function CandidatoCard({ candidato, isAdmin, onDelete, onEdit }: CandidatoCardProps) {
  return (
    <article className="rounded-panel border border-neutral-200 bg-white/75 p-4 dark:border-brand-line dark:bg-black/[0.16]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-panel bg-brand-orange text-brand-ink">
            {candidato.fotoUrl ? (
              <img
                alt={candidato.nombreCandidato}
                className="h-full w-full object-cover"
                src={candidato.fotoUrl}
              />
            ) : (
              <Vote aria-hidden="true" size={24} strokeWidth={2.8} />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight text-brand-ink dark:text-white">
              {candidato.nombreCandidato}
            </p>
            <p className="mt-1 font-body text-xs font-black uppercase text-brand-orange">
              {candidato.tipo.nombre} - Lista {candidato.numeroLista || "-"}
              {candidato.localidad ? ` - ${candidato.localidad}` : ""}
            </p>
            <p className="mt-1 font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              {candidato.cargo || "Sin cargo definido"}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex gap-2">
            <button
              aria-label={`Editar ${candidato.nombreCandidato}`}
              className="rounded-panel border border-neutral-300 bg-white p-2 text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
              onClick={() => onEdit(candidato)}
              type="button"
            >
              <Edit3 aria-hidden="true" size={16} strokeWidth={2.6} />
            </button>
            <button
              aria-label={`Eliminar ${candidato.nombreCandidato}`}
              className="rounded-panel border border-neutral-300 bg-white p-2 text-brand-ink transition hover:border-red-500 hover:text-red-500 dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
              onClick={() => onDelete(candidato)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} strokeWidth={2.6} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 text-sm text-neutral-700 dark:text-orange-50/80 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2">
          <MapPin aria-hidden="true" className="text-brand-orange" size={15} />
          Departamento: {candidato.departamento || "-"}
        </span>
        <span>Ciudad: {candidato.ciudad || "-"}</span>
        <span>Localidad: {candidato.localidad || "-"}</span>
        <span>Activo: {candidato.activo ? "Si" : "No"}</span>
      </div>

      {candidato.observaciones ? (
        <p className="mt-3 font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
          {candidato.observaciones}
        </p>
      ) : null}

      <p className="mt-3 inline-flex items-center gap-2 font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
        <UserRound aria-hidden="true" size={14} strokeWidth={2.7} />
        Creado por {candidato.createdByUser || "-"} - {formatDate(candidato.createdAt)}
      </p>
    </article>
  );
}

interface FieldProps {
  className?: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  value: string;
  withAccent?: boolean;
}

interface SelectFieldProps {
  className?: string;
  disabled?: boolean;
  label: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
}

function Field({ className = "", label, onChange, placeholder, value, withAccent }: FieldProps) {
  return (
    <label className={`space-y-2 text-sm font-semibold text-neutral-700 dark:text-orange-50/80 ${className}`}>
      <span>{label}</span>
      <input
        className={[
          "min-h-11 w-full rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-base font-black text-brand-ink outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 dark:bg-brand-field",
          withAccent ? "border-l-4 border-l-brand-orange" : "",
        ].join(" ")}
        onChange={onChange}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function SelectField({
  className = "",
  disabled = false,
  label,
  onChange,
  options,
  placeholder,
  value,
}: SelectFieldProps) {
  return (
    <label className={`space-y-2 text-sm font-semibold text-neutral-700 dark:text-orange-50/80 ${className}`}>
      <span>{label}</span>
      <select
        className="min-h-11 w-full rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-base font-black text-brand-ink outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 dark:bg-brand-field dark:disabled:bg-white/[0.06] dark:disabled:text-orange-50/45"
        disabled={disabled}
        onChange={onChange}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALIANZA" ? "Alianza" : option}
          </option>
        ))}
      </select>
    </label>
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

export default CandidatosPage;
