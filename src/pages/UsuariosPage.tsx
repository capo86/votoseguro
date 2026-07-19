import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  IdCard,
  KeyRound,
  Loader2,
  MapPin,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Button from "../components/ui/Button";
import {
  PARAGUAY_DEPARTMENTS,
  findParaguayCityName,
  findParaguayDepartmentName,
  getParaguayCitiesByDepartment,
} from "../data/paraguayTerritories";
import {
  actualizarUserProfile,
  crearUserProfile,
  listarUserProfiles,
  lookupPadronForUser,
  resetUserProfilePassword,
} from "../lib/userProfilesApi";
import type { UserProfile, UserRole, UserStatus } from "../types/userProfile";
import type { PadronResponse } from "../types/votante";

interface UserFormState {
  cedula: string;
  ciudad: string;
  departamento: string;
  estado: UserStatus;
  localidad: string;
  nombreApellido: string;
  password: string;
  role: UserRole;
}

const initialForm: UserFormState = {
  cedula: "",
  ciudad: "",
  departamento: "",
  estado: "activo",
  localidad: "",
  nombreApellido: "",
  password: "",
  role: "referente",
};

function UsuariosPage() {
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [feedback, setFeedback] = useState("Gestion de usuarios lista.");
  const [form, setForm] = useState<UserFormState>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [padronData, setPadronData] = useState<PadronResponse | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [query, setQuery] = useState("");

  const cityOptions = getParaguayCitiesByDepartment(form.departamento);
  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return profiles;
    }

    return profiles.filter((profile) =>
      [
        profile.cedula,
        profile.nombreApellido,
        profile.departamento,
        profile.ciudad,
        profile.localidad,
        profile.role,
        profile.estado,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [profiles, query]);

  async function loadProfiles() {
    setIsLoading(true);

    try {
      const data = await listarUserProfiles();
      setProfiles(data);
      setFeedback(data.length ? `${data.length} usuarios cargados.` : "Todavia no hay usuarios.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo cargar usuarios.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfiles();
  }, []);

  const handleChange =
    (field: keyof UserFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;

      setForm((currentForm) => ({
        ...currentForm,
        ...(field === "departamento" ? { ciudad: "" } : {}),
        [field]: value,
      }));

      if (field === "cedula") {
        setPadronData(null);
        setForm((currentForm) => ({
          ...currentForm,
          cedula: value,
          ciudad: "",
          departamento: "",
          nombreApellido: "",
        }));
      }

      setFeedback("Cambios pendientes.");
    };

  const handleLookup = async () => {
    setIsLookingUp(true);
    setFeedback("Consultando padron.");

    try {
      const data = await lookupPadronForUser(form.cedula);
      const departamento = findParaguayDepartmentName(data.departamento) ?? "";
      const ciudad = findParaguayCityName(departamento, data.distrito) ?? "";
      setPadronData(data);
      setForm((currentForm) => ({
        ...currentForm,
        ciudad,
        departamento,
        nombreApellido: data.nombreApellido,
      }));
      setFeedback("Cedula encontrada. Completa perfil, territorio y contraseña.");
    } catch (error) {
      setPadronData(null);
      setFeedback(error instanceof Error ? error.message : "No se pudo consultar el padron.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const resetForm = () => {
    setEditingProfile(null);
    setForm(initialForm);
    setPadronData(null);
    setFeedback("Formulario limpio.");
  };

  const handleEdit = (profile: UserProfile) => {
    setEditingProfile(profile);
    setPadronData(null);
    setForm({
      cedula: profile.cedula,
      ciudad: findParaguayCityName(profile.departamento, profile.ciudad) ?? "",
      departamento: findParaguayDepartmentName(profile.departamento) ?? "",
      estado: profile.estado,
      localidad: profile.localidad ?? "",
      nombreApellido: profile.nombreApellido,
      password: "",
      role: profile.role,
    });
    setFeedback(`Editando ${profile.nombreApellido}.`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.departamento || !form.ciudad) {
      setFeedback("Selecciona departamento y ciudad.");
      return;
    }

    if (!editingProfile && !padronData) {
      setFeedback("Consulta una cedula valida antes de crear usuario.");
      return;
    }

    if (!editingProfile && form.password.trim().length < 6) {
      setFeedback("Define una contraseña inicial de al menos 6 caracteres.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingProfile) {
        const updated = await actualizarUserProfile({
          ciudad: form.ciudad,
          departamento: form.departamento,
          estado: form.estado,
          id: editingProfile.id,
          localidad: form.localidad,
          role: form.role,
        });

        if (form.password.trim()) {
          await resetUserProfilePassword(editingProfile.id, form.password);
        }

        setProfiles((currentProfiles) =>
          currentProfiles.map((profile) => (profile.id === updated.id ? updated : profile)),
        );
        setFeedback(form.password.trim() ? "Usuario actualizado y contraseña restablecida." : "Usuario actualizado.");
      } else {
        const created = await crearUserProfile({
          cedula: form.cedula,
          ciudad: form.ciudad,
          departamento: form.departamento,
          estado: form.estado,
          localidad: form.localidad,
          password: form.password,
          role: form.role,
        });
        setProfiles((currentProfiles) => [created, ...currentProfiles]);
        setFeedback("Usuario creado.");
      }

      resetForm();
      await loadProfiles();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo guardar usuario.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Usuarios</p>
            <h2 className="mt-1 font-display text-3xl leading-none text-brand-ink sm:text-4xl dark:text-white">
              Alta por cedula
            </h2>
            <p className="mt-2 max-w-2xl font-body text-sm font-semibold text-neutral-600 dark:text-orange-50/70">
              Crea referentes y administradores desde el padron, con territorio operativo y estado de acceso.
            </p>
          </div>
          <div className="w-fit rounded-panel border border-neutral-200 bg-white/70 px-3 py-2 font-body text-sm font-black text-neutral-700 dark:border-brand-line dark:bg-black/[0.18] dark:text-white">
            {isLoading ? "Cargando" : `${profiles.length} usuarios`}
          </div>
        </div>
      </section>

      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Perfil</p>
            <h3 className="font-display text-2xl text-brand-ink dark:text-white">
              {editingProfile ? "Editar usuario" : "Nuevo usuario"}
            </h3>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
            onClick={resetForm}
            type="button"
          >
            <UserPlus aria-hidden="true" size={16} strokeWidth={2.7} />
            Nuevo
          </button>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="block text-sm font-semibold text-neutral-700 dark:text-orange-50/80"
              htmlFor="user-cedula"
            >
              Cedula
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <IdCard
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange"
                  size={18}
                  strokeWidth={2.6}
                />
                <input
                  className={inputClass("pl-10")}
                  disabled={Boolean(editingProfile)}
                  id="user-cedula"
                  inputMode="numeric"
                  onChange={handleChange("cedula")}
                  placeholder="Numero de cedula"
                  value={form.cedula}
                />
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
                disabled={Boolean(editingProfile) || isLookingUp}
                type="button"
                onClick={handleLookup}
              >
                {isLookingUp ? (
                  <Loader2 aria-hidden="true" className="animate-spin" size={16} strokeWidth={2.7} />
                ) : (
                  <Search aria-hidden="true" size={16} strokeWidth={2.7} />
                )}
                Buscar
              </button>
            </div>
          </div>

          <ReadOnlyField icon={<UsersRound aria-hidden="true" size={18} />} label="Nombre" value={form.nombreApellido} />

          <SelectField
            label="Rol"
            onChange={handleChange("role")}
            options={[
              { label: "Referente", value: "referente" },
              { label: "Admin", value: "admin" },
            ]}
            value={form.role}
          />

          <SelectField
            label="Estado"
            onChange={handleChange("estado")}
            options={[
              { label: "Activo", value: "activo" },
              { label: "Inactivo", value: "inactivo" },
            ]}
            value={form.estado}
          />

          <SelectField
            label="Departamento"
            onChange={handleChange("departamento")}
            options={PARAGUAY_DEPARTMENTS.map((department) => ({
              label: department.name,
              value: department.name,
            }))}
            placeholder="Seleccionar departamento"
            value={form.departamento}
          />

          <SelectField
            disabled={!form.departamento}
            label="Ciudad"
            onChange={handleChange("ciudad")}
            options={cityOptions.map((city) => ({ label: city, value: city }))}
            placeholder={form.departamento ? "Seleccionar ciudad" : "Selecciona departamento"}
            value={form.ciudad}
          />

          <TextField
            icon={<MapPin aria-hidden="true" size={18} />}
            label="Localidad"
            onChange={handleChange("localidad")}
            placeholder="Barrio, zona o equipo"
            value={form.localidad}
          />

          <TextField
            icon={<KeyRound aria-hidden="true" size={18} />}
            label={editingProfile ? "Nueva contraseña opcional" : "contraseña inicial"}
            onChange={handleChange("password")}
            placeholder={editingProfile ? "Dejar vacio para no cambiar" : "Minimo 6 caracteres"}
            type="password"
            value={form.password}
          />

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 rounded-panel border border-brand-orange/40 bg-brand-orange/10 px-4 py-3 font-body text-sm font-bold text-brand-ink dark:text-orange-50">
              {feedback.toLowerCase().includes("no ") || feedback.toLowerCase().includes("falta") ? (
                <AlertCircle aria-hidden="true" size={18} strokeWidth={2.6} />
              ) : (
                <CheckCircle2 aria-hidden="true" size={18} strokeWidth={2.6} />
              )}
              {feedback}
            </div>
          </div>

          <div className="grid gap-2 md:col-span-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
              {editingProfile ? "Edita permisos, estado o territorio." : "La cedula debe existir en el padron."}
            </p>
            <Button
              className="w-full sm:min-w-56"
              icon={<Save aria-hidden="true" size={18} strokeWidth={2.8} />}
              isLoading={isSaving}
              type="submit"
            >
              {editingProfile ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </div>
        </form>
      </section>

      <section className="voto-card rounded-panel border border-neutral-200 bg-white/[0.9] p-4 shadow-panel backdrop-blur sm:p-6 dark:border-brand-line dark:bg-neutral-900/[0.92]">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="font-body text-xs font-black uppercase text-brand-orange">Listado</p>
            <h3 className="font-display text-2xl text-brand-ink dark:text-white">
              Usuarios operativos
            </h3>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-sm font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
            onClick={() => void loadProfiles()}
            type="button"
          >
            <RefreshCcw aria-hidden="true" size={16} strokeWidth={2.7} />
            Actualizar
          </button>
        </div>

        <div className="mt-4">
          <input
            className={inputClass()}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar por cedula, nombre, ciudad o localidad"
            value={query}
          />
        </div>

        <div className="mt-5 grid gap-3">
          {isLoading ? (
            <div className="inline-flex min-h-20 items-center gap-3 rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-brand-ink dark:border-brand-line dark:bg-black/[0.16] dark:text-white">
              <Loader2 aria-hidden="true" className="animate-spin text-brand-orange" size={22} />
              Cargando usuarios
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="rounded-panel border border-neutral-200 bg-white/70 p-4 font-body font-black text-neutral-600 dark:border-brand-line dark:bg-black/[0.16] dark:text-orange-50/70">
              No hay usuarios para mostrar.
            </div>
          ) : (
            filteredProfiles.map((profile) => (
              <article
                className="rounded-panel border border-neutral-200 bg-white/75 p-4 dark:border-brand-line dark:bg-black/[0.16]"
                key={profile.id}
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div className="min-w-0">
                    <p className="font-display text-xl leading-tight text-brand-ink dark:text-white">
                      {profile.nombreApellido}
                    </p>
                    <p className="mt-1 font-body text-sm font-black uppercase text-brand-orange">
                      Cedula {profile.cedula}
                    </p>
                  </div>
                  <button
                    aria-label={`Editar ${profile.nombreApellido}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-xs font-black uppercase text-brand-ink transition hover:border-brand-orange hover:text-brand-orange dark:border-brand-line dark:bg-white/[0.06] dark:text-white"
                    onClick={() => handleEdit(profile)}
                    type="button"
                  >
                    <Edit3 aria-hidden="true" size={15} strokeWidth={2.6} />
                    Editar
                  </button>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-neutral-700 dark:text-orange-50/80 md:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Perfil" value={profile.role === "admin" ? "Admin" : "Referente"} />
                  <Metric label="Estado" value={profile.estado === "activo" ? "Activo" : "Inactivo"} />
                  <Metric label="Territorio" value={`${profile.departamento} / ${profile.ciudad}`} />
                  <Metric label="Localidad" value={profile.localidad || "-"} />
                </div>

                <p className="mt-4 inline-flex items-center gap-2 font-body text-xs font-black uppercase text-neutral-500 dark:text-orange-100/[0.58]">
                  <ShieldCheck aria-hidden="true" size={14} strokeWidth={2.7} />
                  Creado {formatDate(profile.createdAt)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  disabled?: boolean;
  label: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
}

function SelectField({ disabled = false, label, onChange, options, placeholder, value }: SelectFieldProps) {
  return (
    <label className="space-y-2 text-sm font-semibold text-neutral-700 dark:text-orange-50/80">
      <span>{label}</span>
      <select
        className={inputClass()}
        disabled={disabled}
        onChange={onChange}
        value={value}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface TextFieldProps {
  icon?: JSX.Element;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  value: string;
}

function TextField({ icon, label, onChange, placeholder, type = "text", value }: TextFieldProps) {
  return (
    <label className="space-y-2 text-sm font-semibold text-neutral-700 dark:text-orange-50/80">
      <span>{label}</span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-brand-orange">
            {icon}
          </span>
        ) : null}
        <input
          className={inputClass(icon ? "pl-10" : "")}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </div>
    </label>
  );
}

interface ReadOnlyFieldProps {
  icon: JSX.Element;
  label: string;
  value: string;
}

function ReadOnlyField({ icon, label, value }: ReadOnlyFieldProps) {
  return (
    <label className="space-y-2 text-sm font-semibold text-neutral-700 dark:text-orange-50/80">
      <span>{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-brand-orange">
          {icon}
        </span>
        <input
          className={inputClass("pl-10")}
          placeholder="Se completa desde el padron"
          readOnly
          value={value}
        />
      </div>
    </label>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
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

function inputClass(extra = "") {
  return [
    "min-h-11 w-full rounded-panel border border-neutral-300 bg-white px-3 py-2 font-body text-base font-black text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 dark:bg-brand-field dark:disabled:bg-white/[0.06] dark:disabled:text-orange-50/45 read-only:cursor-not-allowed read-only:bg-neutral-100 read-only:text-neutral-700 dark:read-only:bg-white/[0.06] dark:read-only:text-orange-50/80",
    extra,
  ].join(" ");
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

export default UsuariosPage;
