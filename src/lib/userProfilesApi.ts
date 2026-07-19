import type { PadronResponse } from "../types/votante";
import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfile,
  UserRole,
  UserStatus,
} from "../types/userProfile";
import { supabase } from "./supabaseClient";

interface UserProfileRow {
  id: string;
  auth_user_id: string;
  cedula: string;
  padron_ogc_fid: number | null;
  padron_cedula: number | string | null;
  nombre: string | null;
  apellido: string | null;
  nombre_apellido: string;
  sexo: string | null;
  fecha_nacimiento: string | null;
  fecha_inscripcion: string | null;
  depart: number | string | null;
  departamento: string;
  distrito: number | string | null;
  ciudad: string;
  zona: number | string | null;
  zona_descripcion: string | null;
  local: number | string | null;
  local_descripcion: string | null;
  localidad: string | null;
  role: UserRole;
  estado: UserStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface PadronFunctionRow {
  ogc_fid: number | null;
  cedula: number | string | null;
  nombre: string | null;
  apellido: string | null;
  nombre_apellido: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null;
  fecha_inscripcion: string | null;
  depart: number | string | null;
  departamento: string | null;
  distrito: number | string | null;
  distrito_descripcion: string | null;
  zona: number | string | null;
  zona_descripcion: string | null;
  local: number | string | null;
  local_descripcion: string | null;
}

type FunctionResponse<T> = {
  data?: T;
  error?: string;
};

interface FunctionErrorWithContext {
  context?: {
    json: () => Promise<unknown>;
  };
  message?: string;
}

const USER_PROFILE_COLUMNS =
  "id,auth_user_id,cedula,padron_ogc_fid,padron_cedula,nombre,apellido,nombre_apellido,sexo,fecha_nacimiento,fecha_inscripcion,depart,departamento,distrito,ciudad,zona,zona_descripcion,local,local_descripcion,localidad,role,estado,created_by,updated_by,created_at,updated_at";

function requireSupabase() {
  if (!supabase) {
    throw new Error("El servicio no esta configurado.");
  }

  return supabase;
}

function asString(value: number | string | null | undefined) {
  return value === null || value === undefined ? undefined : String(value);
}

function rowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    apellido: row.apellido ?? undefined,
    authUserId: row.auth_user_id,
    cedula: row.cedula,
    ciudad: row.ciudad,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
    depart: asString(row.depart),
    departamento: row.departamento,
    distrito: asString(row.distrito),
    estado: row.estado,
    fechaInscripcion: row.fecha_inscripcion ?? undefined,
    fechaNacimiento: row.fecha_nacimiento ?? undefined,
    id: row.id,
    local: asString(row.local),
    localDescripcion: row.local_descripcion ?? undefined,
    localidad: row.localidad ?? undefined,
    nombre: row.nombre ?? undefined,
    nombreApellido: row.nombre_apellido,
    padronCedula: asString(row.padron_cedula),
    padronOgcFid: row.padron_ogc_fid ?? undefined,
    role: row.role,
    sexo: row.sexo ?? undefined,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? undefined,
    zona: asString(row.zona),
    zonaDescripcion: row.zona_descripcion ?? undefined,
  };
}

function rowToPadronResponse(row: PadronFunctionRow): PadronResponse {
  return {
    apellido: row.apellido?.trim() || undefined,
    cedula: row.cedula ? String(row.cedula) : "",
    departamento: row.departamento?.trim() ?? "",
    departamentoCodigo: asString(row.depart),
    distrito: row.distrito_descripcion?.trim() ?? "",
    distritoCodigo: asString(row.distrito),
    fechaInscripcion: row.fecha_inscripcion ?? undefined,
    fechaNacimiento: row.fecha_nacimiento ?? undefined,
    local: row.local_descripcion?.trim() ?? "",
    localCodigo: asString(row.local),
    nombre: row.nombre?.trim() || undefined,
    nombreApellido: row.nombre_apellido?.trim() ?? "",
    padronOgcFid: row.ogc_fid ?? undefined,
    sexo: row.sexo?.trim() || undefined,
    zona: row.zona_descripcion?.trim() ?? "",
    zonaCodigo: asString(row.zona),
  };
}

async function invokeAdminUsers<T>(action: string, payload: Record<string, unknown>) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke<FunctionResponse<T>>("admin-users", {
    body: {
      action,
      payload,
    },
  });

  if (error) {
    const context = (error as FunctionErrorWithContext).context;

    if (context) {
      try {
        const errorBody = await context.json();

        if (
          typeof errorBody === "object" &&
          errorBody !== null &&
          "error" in errorBody &&
          typeof errorBody.error === "string"
        ) {
          throw new Error(errorBody.error);
        }
      } catch (contextError) {
        if (contextError instanceof Error) {
          throw contextError;
        }
      }
    }

    throw new Error(error.message || "No se pudo procesar la solicitud.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data || data.data === undefined) {
    throw new Error("La respuesta del servicio no tiene el formato esperado.");
  }

  return data.data;
}

export async function getCurrentUserProfile(authUserId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("user_profiles")
    .select(USER_PROFILE_COLUMNS)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? rowToUserProfile(data as UserProfileRow) : null;
}

export async function listarUserProfiles() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("user_profiles")
    .select(USER_PROFILE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as UserProfileRow[]).map(rowToUserProfile);
}

export async function lookupPadronForUser(cedula: string) {
  const row = await invokeAdminUsers<PadronFunctionRow>("lookup-padron", { cedula });

  return rowToPadronResponse(row);
}

export async function crearUserProfile(values: CreateUserProfileInput) {
  const row = await invokeAdminUsers<UserProfileRow>("create", { ...values });

  return rowToUserProfile(row);
}

export async function actualizarUserProfile(values: UpdateUserProfileInput) {
  const row = await invokeAdminUsers<UserProfileRow>("update", { ...values });

  return rowToUserProfile(row);
}

export async function resetUserProfilePassword(id: string, password: string) {
  await invokeAdminUsers<{ ok: boolean }>("reset-password", { id, password });
}
