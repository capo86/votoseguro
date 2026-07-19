import type { User } from "@supabase/supabase-js";
import type { Candidato } from "../types/candidato";
import type { PadronResponse, RegistroVotanteFormValues } from "../types/votante";
import { supabase } from "./supabaseClient";

export interface CrearVotoSeguroSnapshotArgs {
  candidato: Candidato;
  padron: PadronResponse | null;
  user: User | null;
  values: RegistroVotanteFormValues;
}

export interface VotoSeguroFilters {
  candidatoId?: string;
  cedula?: string;
  dateFrom?: string;
  dateTo?: string;
  loadedBy?: string;
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
  loadedBy?: string;
  loadedByEmail?: string;
  estado: string;
  createdAt: string;
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
  loaded_by: string | null;
  loaded_by_email: string | null;
  estado: string;
  created_at: string;
}

const VOTO_SEGURO_COLUMNS =
  "id,cedula,nombre_apellido,telefono,departamento,distrito_descripcion,zona_descripcion,local_descripcion,local_votacion,mesa,orden,candidato_id,candidato_nombre,candidato_numero_lista,candidato_cargo,loaded_by,loaded_by_email,estado,created_at";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
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
    createdAt: row.created_at,
    departamento: row.departamento ?? undefined,
    distrito: row.distrito_descripcion ?? undefined,
    estado: row.estado,
    id: row.id,
    loadedBy: row.loaded_by ?? undefined,
    loadedByEmail: row.loaded_by_email ?? undefined,
    local: row.local_descripcion ?? undefined,
    localVotacion: row.local_votacion ?? undefined,
    mesa: row.mesa ?? undefined,
    nombreApellido: row.nombre_apellido,
    orden: row.orden ?? undefined,
    telefono: row.telefono,
    zona: row.zona_descripcion ?? undefined,
  };
}

export async function crearVotoSeguroSnapshot({
  candidato,
  padron,
  user,
  values,
}: CrearVotoSeguroSnapshotArgs) {
  const client = requireSupabase();

  if (!values.ubicacion) {
    throw new Error("Marca la ubicacion del votante antes de guardar.");
  }

  const payload = {
    apellido: emptyToNull(padron?.apellido),
    candidato_cargo: emptyToNull(candidato.cargo),
    candidato_ciudad: emptyToNull(candidato.ciudad),
    candidato_departamento: emptyToNull(candidato.departamento),
    candidato_id: candidato.id,
    candidato_localidad: emptyToNull(candidato.localidad),
    candidato_nombre: candidato.nombreCandidato,
    candidato_numero_lista: emptyToNull(candidato.numeroLista),
    candidato_snapshot: candidato,
    cedula: values.cedula.trim(),
    depart: toNumber(padron?.departamentoCodigo),
    departamento: values.departamento.trim(),
    distrito: toNumber(padron?.distritoCodigo),
    distrito_descripcion: values.distrito.trim(),
    estado: "activo",
    fecha_inscripcion: padron?.fechaInscripcion ?? null,
    fecha_nacimiento: padron?.fechaNacimiento ?? null,
    loaded_by: user?.id,
    loaded_by_email: emptyToNull(user?.email),
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
    throw new Error(error.message);
  }

  return data as { created_at: string; id: string };
}

export async function listarVotoSeguroSnapshots(filters: VotoSeguroFilters = {}) {
  const client = requireSupabase();
  let query = client
    .from("votoseguro")
    .select(VOTO_SEGURO_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(80);

  const normalizedCedula = filters.cedula?.replace(/\D/g, "");

  if (normalizedCedula) {
    query = query.ilike("cedula", `%${normalizedCedula}%`);
  }

  if (filters.candidatoId) {
    query = query.eq("candidato_id", filters.candidatoId);
  }

  if (filters.loadedBy) {
    query = query.eq("loaded_by", filters.loadedBy);
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
