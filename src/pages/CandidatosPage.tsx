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
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  actualizarCandidato,
  crearCandidato,
  eliminarCandidato,
  listarCandidatos,
  type CandidatoFormValues,
} from "../lib/candidatosApi";
import { uploadCandidatePhoto } from "../lib/candidatePhotosApi";
import { useAppStore } from "../store/appStore";
import type { Candidato } from "../types/candidato";

const initialForm: CandidatoFormValues = {
  nombreCandidato: "",
  cargo: "",
  numeroLista: "",
  localidad: "",
  departamento: "",
  ciudad: "",
  fotoUrl: "",
  observaciones: "",
};

function CandidatosPage() {
  const user = useAppStore((state) => state.user);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [form, setForm] = useState<CandidatoFormValues>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("Candidatos conectado a Supabase.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const createdByUser = user?.email ?? "usuario activo";

  useEffect(() => {
    let isMounted = true;

    async function loadCandidatos() {
      setIsLoading(true);

      try {
        const data = await listarCandidatos();

        if (isMounted) {
          setCandidatos(data);
          setFeedback(data.length ? "Candidatos cargados desde Supabase." : "Sin candidatos cargados.");
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
  }, []);

  const handleChange =
    (field: keyof CandidatoFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((currentForm) => ({
        ...currentForm,
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
        setFeedback("Candidato actualizado en Supabase.");
      } else {
        const created = await crearCandidato(form, createdByUser);
        setCandidatos((currentCandidatos) => [created, ...currentCandidatos]);
        setFeedback("Candidato creado en Supabase.");
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
    setEditingId(candidato.id);
    setForm({
      cargo: candidato.cargo ?? "",
      ciudad: candidato.ciudad ?? "",
      departamento: candidato.departamento ?? "",
      fotoUrl: candidato.fotoUrl ?? "",
      localidad: candidato.localidad ?? "",
      nombreCandidato: candidato.nombreCandidato,
      numeroLista: candidato.numeroLista ?? "",
      observaciones: candidato.observaciones ?? "",
    });
    setFeedback(`Editando ${candidato.nombreCandidato}.`);
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);

    try {
      await eliminarCandidato(id);
      setCandidatos((currentCandidatos) =>
        currentCandidatos.filter((candidato) => candidato.id !== id),
      );

      if (editingId === id) {
        resetForm();
      }

      setFeedback("Candidato eliminado de Supabase.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo eliminar candidato.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
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
          <Field
            label="Departamento"
            onChange={handleChange("departamento")}
            placeholder="Central"
            value={form.departamento}
          />
          <Field
            label="Ciudad"
            onChange={handleChange("ciudad")}
            placeholder="Asuncion"
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

        <div className="mt-5 grid gap-3">
          {isLoading ? (
            <div className="inline-flex items-center gap-2 rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black dark:border-brand-line dark:bg-black/[0.16]">
              <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={18} />
              Cargando candidatos
            </div>
          ) : candidatos.length === 0 ? (
            <div className="rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-neutral-600 dark:border-brand-line dark:bg-black/[0.16] dark:text-orange-50/70">
              Todavia no hay candidatos. Carga el primero arriba.
            </div>
          ) : (
            candidatos.map((candidato) => (
              <article
                className="rounded-panel border border-neutral-200 bg-white/75 p-4 dark:border-brand-line dark:bg-black/[0.16]"
                key={candidato.id}
              >
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
                        Lista {candidato.numeroLista || "-"}
                        {candidato.localidad ? ` - ${candidato.localidad}` : ""}
                      </p>
                      <p className="mt-1 font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
                        {candidato.cargo || "Sin cargo definido"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      aria-label={`Editar ${candidato.nombreCandidato}`}
                      className="rounded-panel border border-neutral-300 bg-white p-2 text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
                      onClick={() => handleEdit(candidato)}
                      type="button"
                    >
                      <Edit3 aria-hidden="true" size={16} strokeWidth={2.6} />
                    </button>
                    <button
                      aria-label={`Eliminar ${candidato.nombreCandidato}`}
                      className="rounded-panel border border-neutral-300 bg-white p-2 text-brand-ink transition hover:border-red-500 hover:text-red-500 dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
                      onClick={() => handleDelete(candidato.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} strokeWidth={2.6} />
                    </button>
                  </div>
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
            ))
          )}
        </div>
      </section>
    </section>
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
