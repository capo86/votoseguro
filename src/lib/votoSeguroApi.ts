import type { User } from "@supabase/supabase-js";
import type { Candidato } from "../types/candidato";
import type { UserProfile } from "../types/userProfile";
import type { PadronResponse, RegistroVotanteFormValues } from "../types/votante";
import { supabase } from "./supabaseClient";

export interface CrearVotoSeguroSnapshotArgs {
  candidatoConcejal: Candidato;
  candidatoIntendente?: Candidato | null;
  padron: PadronResponse | null;
  profile: UserProfile | null;
  user: User | null;
  values: RegistroVotanteFormValues;
}

export interface VotoSeguroFilters {
  candidatoId?: string;
  cedula?: string;
  ciudad?: string;
  departamento?: string;
  dateFrom?: string;
  dateTo?: string;
  fueNotificado?: boolean;
  loadedBy?: string;
  loadedByLocalidad?: string;
  nombre?: string;
  telefono?: string;
}

export interface VotoSeguroRecord {
  id: string;
  cedula: string;
  nombreApellido: string;
  telefono: string;
  departamento?: string;
  distrito?: string;
  zona?: string;
  local?: string;
  localVotacion?: string;
  mesa?: string;
  orden?: string;
  candidatoId?: string;
  candidatoNombre: string;
  candidatoNumeroLista?: string;
  candidatoCargo?: string;
  concejalId?: string;
  concejalNombre?: string;
  concejalNumeroLista?: string;
  concejalCargo?: string;
  fechaNotificacion?: string;
  fechaRenotificacion?: string;
  fueNotificado: boolean;
  intendenteId?: string;
  intendenteNombre?: string;
  intendenteNumeroLista?: string;
  intendenteCargo?: string;
  loadedBy?: string;
  loadedByCedula?: string;
  loadedByCiudad?: string;
  loadedByDepartamento?: string;
  loadedByLocalidad?: string;
  loadedByNombre?: string;
  loadedByRole?: string;
  estado: string;
  createdAt: string;
  userNotifico?: string;
}

export interface VotoSeguroDuplicateInfo {
  cedula: string;
  createdAt: string;
  id: string;
  loadedBy?: string;
  loadedByCedula?: string;
  loadedByCiudad?: string;
  loadedByDepartamento?: string;
  loadedByLocalidad?: string;
  loadedByNombre: string;
  nombreApellido: string;
}

export class VotoSeguroDuplicateError extends Error {
  duplicate: VotoSeguroDuplicateInfo;

  constructor(duplicate: VotoSeguroDuplicateInfo) {
    super(`Esta cedula ya fue cargada por ${duplicate.loadedByNombre}.`);
    this.duplicate = duplicate;
    this.name = "VotoSeguroDuplicateError";
  }
}

interface VotoSeguroRow {
  id: string;
  cedula: string;
  nombre_apellido: string;
  telefono: string;
  departamento: string | null;
  distrito_descripcion: string | null;
  zona_descripcion: string | null;
  local_descripcion: string | null;
  local_votacion: string | null;
  mesa: string | null;
  orden: string | null;
  candidato_id: string | null;
  candidato_nombre: string;
  candidato_numero_lista: string | null;
  candidato_cargo: string | null;
  concejal_id: string | null;
  concejal_nombre: string | null;
  concejal_numero_lista: string | null;
  concejal_cargo: string | null;
  fecha_notificacion: string | null;
  fecha_renotificacion: string | null;
  fue_notificado: boolean | null;
  intendente_id: string | null;
  intendente_nombre: string | null;
  intendente_numero_lista: string | null;
  intendente_cargo: string | null;
  loaded_by: string | null;
  loaded_by_cedula: string | null;
  loaded_by_ciudad: string | null;
  loaded_by_departamento: string | null;
  loaded_by_localidad: string | null;
  loaded_by_nombre: string | null;
  loaded_by_role: string | null;
  estado: string;
  created_at: string;
  user_notifico: string | null;
}

interface VotoSeguroDuplicateRow {
  id: string;
  cedula: string;
  nombre_apellido: string;
  loaded_by: string | null;
  loaded_by_cedula: string | null;
  loaded_by_ciudad: string | null;
  loaded_by_departamento: string | null;
  loaded_by_localidad: string | null;
  loaded_by_nombre: string | null;
  created_at: string;
}

const VOTO_SEGURO_COLUMNS =
  "id,cedula,nombre_apellido,telefono,departamento,distrito_descripcion,zona_descripcion,local_descripcion,local_votacion,mesa,orden,candidato_id,candidato_nombre,candidato_numero_lista,candidato_cargo,concejal_id,concejal_nombre,concejal_numero_lista,concejal_cargo,fue_notificado,user_notifico,fecha_notificacion,fecha_renotificacion,intendente_id,intendente_nombre,intendente_numero_lista,intendente_cargo,loaded_by,loaded_by_cedula,loaded_by_ciudad,loaded_by_departamento,loaded_by_localidad,loaded_by_nombre,loaded_by_role,estado,created_at";

function requireSupabase() {
  if (!supabase) {
    throw new Error("El servicio no esta configurado.");
  }

  return supabase;
}

function toNumber(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function rowToVotoSeguroRecord(row: VotoSeguroRow): VotoSeguroRecord {
  return {
    candidatoCargo: row.candidato_cargo ?? undefined,
    candidatoId: row.candidato_id ?? undefined,
    candidatoNombre: row.candidato_nombre,
    candidatoNumeroLista: row.candidato_numero_lista ?? undefined,
    cedula: row.cedula,
    concejalCargo: row.concejal_cargo ?? row.candidato_cargo ?? undefined,
    concejalId: row.concejal_id ?? row.candidato_id ?? undefined,
    concejalNombre: row.concejal_nombre ?? row.candidato_nombre ?? undefined,
    concejalNumeroLista: row.concejal_numero_lista ?? row.candidato_numero_lista ?? undefined,
    createdAt: row.created_at,
    departamento: row.departamento ?? undefined,
    distrito: row.distrito_descripcion ?? undefined,
    estado: row.estado,
    fechaNotificacion: row.fecha_notificacion ?? undefined,
    fechaRenotificacion: row.fecha_renotificacion ?? undefined,
    fueNotificado: row.fue_notificado ?? false,
    id: row.id,
    intendenteCargo: row.intendente_cargo ?? undefined,
    intendenteId: row.intendente_id ?? undefined,
    intendenteNombre: row.intendente_nombre ?? undefined,
    intendenteNumeroLista: row.intendente_numero_lista ?? undefined,
    loadedBy: row.loaded_by ?? undefined,
    loadedByCedula: row.loaded_by_cedula ?? undefined,
    loadedByCiudad: row.loaded_by_ciudad ?? undefined,
    loadedByDepartamento: row.loaded_by_departamento ?? undefined,
    loadedByLocalidad: row.loaded_by_localidad ?? undefined,
    loadedByNombre: row.loaded_by_nombre ?? undefined,
    loadedByRole: row.loaded_by_role ?? undefined,
    local: row.local_descripcion ?? undefined,
    localVotacion: row.local_votacion ?? undefined,
    mesa: row.mesa ?? undefined,
    nombreApellido: row.nombre_apellido,
    orden: row.orden ?? undefined,
    telefono: row.telefono,
    userNotifico: row.user_notifico ?? undefined,
    zona: row.zona_descripcion ?? undefined,
  };
}

function rowToDuplicateInfo(row: VotoSeguroDuplicateRow): VotoSeguroDuplicateInfo {
  return {
    cedula: row.cedula,
    createdAt: row.created_at,
    id: row.id,
    loadedBy: row.loaded_by ?? undefined,
    loadedByCedula: row.loaded_by_cedula ?? undefined,
    loadedByCiudad: row.loaded_by_ciudad ?? undefined,
    loadedByDepartamento: row.loaded_by_departamento ?? undefined,
    loadedByLocalidad: row.loaded_by_localidad ?? undefined,
    loadedByNombre: row.loaded_by_nombre || "otro referente",
    nombreApellido: row.nombre_apellido,
  };
}

export async function buscarVotoSeguroExistentePorCedula(cedula: string) {
  const client = requireSupabase();
  const normalizedCedula = cedula.replace(/\D/g, "");
  const { data, error } = await client.rpc("buscar_votoseguro_existente_por_cedula", {
    p_cedula: normalizedCedula,
  });

  if (error) {
    throw new Error(error.message);
  }

  const firstRow = Array.isArray(data) ? (data[0] as VotoSeguroDuplicateRow | undefined) : undefined;

  return firstRow ? rowToDuplicateInfo(firstRow) : null;
}

export async function crearVotoSeguroSnapshot({
  candidatoConcejal,
  candidatoIntendente,
  padron,
  profile,
  user,
  values,
}: CrearVotoSeguroSnapshotArgs) {
  const client = requireSupabase();

  if (!values.ubicacion) {
    throw new Error("Marca la ubicacion del votante antes de guardar.");
  }

  if (!profile || !user) {
    throw new Error("Tu usuario no tiene perfil operativo activo.");
  }

  const duplicate = await buscarVotoSeguroExistentePorCedula(values.cedula);

  if (duplicate) {
    throw new VotoSeguroDuplicateError(duplicate);
  }

  const payload = {
    apellido: emptyToNull(padron?.apellido),
    candidato_cargo: emptyToNull(candidatoConcejal.cargo),
    candidato_ciudad: emptyToNull(candidatoConcejal.ciudad),
    candidato_departamento: emptyToNull(candidatoConcejal.departamento),
    candidato_id: candidatoConcejal.id,
    candidato_localidad: emptyToNull(candidatoConcejal.localidad),
    candidato_nombre: candidatoConcejal.nombreCandidato,
    candidato_numero_lista: emptyToNull(candidatoConcejal.numeroLista),
    candidato_snapshot: candidatoConcejal,
    cedula: values.cedula.trim(),
    concejal_cargo: emptyToNull(candidatoConcejal.cargo),
    concejal_ciudad: emptyToNull(candidatoConcejal.ciudad),
    concejal_departamento: emptyToNull(candidatoConcejal.departamento),
    concejal_id: candidatoConcejal.id,
    concejal_localidad: emptyToNull(candidatoConcejal.localidad),
    concejal_nombre: candidatoConcejal.nombreCandidato,
    concejal_numero_lista: emptyToNull(candidatoConcejal.numeroLista),
    concejal_snapshot: candidatoConcejal,
    depart: toNumber(padron?.departamentoCodigo),
    departamento: values.departamento.trim(),
    distrito: toNumber(padron?.distritoCodigo),
    distrito_descripcion: values.distrito.trim(),
    estado: "activo",
    fecha_inscripcion: padron?.fechaInscripcion ?? null,
    fecha_nacimiento: padron?.fechaNacimiento ?? null,
    intendente_cargo: emptyToNull(candidatoIntendente?.cargo),
    intendente_ciudad: emptyToNull(candidatoIntendente?.ciudad),
    intendente_departamento: emptyToNull(candidatoIntendente?.departamento),
    intendente_id: candidatoIntendente?.id ?? null,
    intendente_localidad: emptyToNull(candidatoIntendente?.localidad),
    intendente_nombre: candidatoIntendente?.nombreCandidato ?? null,
    intendente_numero_lista: emptyToNull(candidatoIntendente?.numeroLista),
    intendente_snapshot: candidatoIntendente ?? {},
    loaded_by: user?.id,
    loaded_by_cedula: profile.cedula,
    loaded_by_ciudad: profile.ciudad,
    loaded_by_departamento: profile.departamento,
    loaded_by_localidad: emptyToNull(profile.localidad),
    loaded_by_nombre: profile.nombreApellido,
    loaded_by_role: profile.role,
    local: toNumber(padron?.localCodigo),
    local_descripcion: values.local.trim(),
    local_votacion: emptyToNull(padron?.localVotacion ?? values.local),
    mesa: emptyToNull(padron?.mesa),
    nombre: emptyToNull(padron?.nombre),
    nombre_apellido: values.nombreApellido.trim(),
    orden: emptyToNull(padron?.orden),
    padron_cedula: toNumber(padron?.cedula ?? values.cedula),
    padron_ogc_fid: padron?.padronOgcFid ?? null,
    padron_snapshot: padron ?? {},
    sexo: emptyToNull(padron?.sexo),
    telefono: values.telefono.trim(),
    ubicacion_lat: values.ubicacion.lat,
    ubicacion_lng: values.ubicacion.lng,
    zona: toNumber(padron?.zonaCodigo),
    zona_descripcion: values.zona.trim(),
  };

  const { data, error } = await client
    .from("votoseguro")
    .insert(payload)
    .select("id,created_at")
    .single();

  if (error) {
    throw new Error(normalizeVotoSeguroError(error.message));
  }

  return data as { created_at: string; id: string };
}

export async function registrarNotificacionWhatsapp(record: VotoSeguroRecord, userId?: string | null) {
  const client = requireSupabase();
  const notificationDate = new Date().toISOString();
  const hadPreviousNotification = Boolean(record.fechaNotificacion);

  const payload = {
    fecha_notificacion: record.fechaNotificacion ?? notificationDate,
    fecha_renotificacion: hadPreviousNotification
      ? notificationDate
      : record.fechaRenotificacion ?? null,
    fue_notificado: true,
    user_notifico: userId ?? null,
  };

  const { data, error } = await client
    .from("votoseguro")
    .update(payload)
    .eq("id", record.id)
    .select(VOTO_SEGURO_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToVotoSeguroRecord(data as VotoSeguroRow);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeVotoSeguroError(message: string) {
  if (
    message.includes("votoseguro_cedula_activo_uidx") ||
    message.toLowerCase().includes("esta cedula ya fue cargada")
  ) {
    return "Esta cedula ya tiene una carga activa en Voto Seguro.";
  }

  return message;
}

export async function listarVotoSeguroSnapshots(filters: VotoSeguroFilters = {}) {
  const client = requireSupabase();
  const cedula = filters.cedula?.replace(/\D/g, "");
  const departamento = filters.departamento?.trim();
  const ciudad = filters.ciudad?.trim();
  const loadedByLocalidad = filters.loadedByLocalidad?.trim();
  const nombre = filters.nombre?.trim();
  const telefono = filters.telefono?.replace(/\D/g, "");

  let query = client
    .from("votoseguro")
    .select(VOTO_SEGURO_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(80);

  if (filters.candidatoId) {
    query = query.or(
      `candidato_id.eq.${filters.candidatoId},concejal_id.eq.${filters.candidatoId},intendente_id.eq.${filters.candidatoId}`,
    );
  }

  if (departamento) {
    query = query.ilike("departamento", `%${departamento}%`);
  }

  if (cedula) {
    query = query.ilike("cedula", `%${cedula}%`);
  }

  if (ciudad) {
    query = query.ilike("distrito_descripcion", `%${ciudad}%`);
  }

  if (nombre) {
    query = query.ilike("nombre_apellido", `%${nombre}%`);
  }

  if (telefono) {
    query = query.ilike("telefono", `%${telefono}%`);
  }

  if (typeof filters.fueNotificado === "boolean") {
    query = query.eq("fue_notificado", filters.fueNotificado);
  }

  if (filters.loadedBy) {
    query = query.eq("loaded_by", filters.loadedBy);
  }

  if (loadedByLocalidad) {
    query = query.ilike("loaded_by_localidad", `%${loadedByLocalidad}%`);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as VotoSeguroRow[]).map(rowToVotoSeguroRecord);
}
