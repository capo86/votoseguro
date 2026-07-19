import { supabase } from "./supabaseClient";
import type { Candidato, CandidatoTipo, CandidatoTipoCodigo } from "../types/candidato";

export interface CandidatoFormValues {
  nombreCandidato: string;
  tipoCodigo: CandidatoTipoCodigo;
  cargo: string;
  numeroLista: string;
  localidad: string;
  departamento: string;
  ciudad: string;
  fotoUrl: string;
  observaciones: string;
}

interface CandidatoRow {
  id: string;
  nombre: string | null;
  nombre_candidato: string | null;
  tipo: CandidatoTipo | null;
  cargo: string | null;
  numero_lista: string | null;
  localidad: string | null;
  departamento: string | null;
  ciudad: string | null;
  foto_url: string | null;
  observaciones: string | null;
  activo: boolean | null;
  created_by_user: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const CANDIDATO_COLUMNS =
  "id,nombre,nombre_candidato,tipo,cargo,numero_lista,localidad,departamento,ciudad,foto_url,observaciones,activo,created_by_user,created_at,updated_at";

const CANDIDATO_TIPOS: Record<CandidatoTipoCodigo, CandidatoTipo> = {
  ALIANZA: {
    codigo: "ALIANZA",
    nombre: "Alianza",
  },
  PPC: {
    codigo: "PPC",
    nombre: "PPC",
  },
};

function requireSupabase() {
  if (!supabase) {
    throw new Error("El servicio no esta configurado.");
  }

  return supabase;
}

function rowToCandidato(row: CandidatoRow): Candidato {
  const nombreCandidato = row.nombre_candidato ?? row.nombre ?? "";
  const tipo = row.tipo?.codigo === "ALIANZA" ? CANDIDATO_TIPOS.ALIANZA : CANDIDATO_TIPOS.PPC;

  return {
    activo: row.activo ?? true,
    cargo: row.cargo ?? undefined,
    ciudad: row.ciudad ?? undefined,
    createdAt: row.created_at ?? undefined,
    createdByUser: row.created_by_user ?? undefined,
    departamento: row.departamento ?? undefined,
    fotoUrl: row.foto_url ?? undefined,
    id: row.id,
    localidad: row.localidad ?? undefined,
    nombreCandidato,
    numeroLista: row.numero_lista ?? undefined,
    observaciones: row.observaciones ?? undefined,
    tipo,
    updatedAt: row.updated_at ?? undefined,
  };
}

function formToPayload(values: CandidatoFormValues, createdByUser?: string) {
  const nombreCandidato = values.nombreCandidato.trim();

  const payload = {
    cargo: values.cargo.trim() || null,
    ciudad: values.ciudad.trim() || null,
    departamento: values.departamento.trim() || null,
    foto_url: values.fotoUrl.trim() || null,
    localidad: values.localidad.trim() || null,
    nombre: nombreCandidato,
    nombre_candidato: nombreCandidato,
    numero_lista: values.numeroLista.trim() || null,
    observaciones: values.observaciones.trim() || null,
    tipo: CANDIDATO_TIPOS[values.tipoCodigo] ?? CANDIDATO_TIPOS.PPC,
  };

  if (createdByUser) {
    return {
      ...payload,
      created_by_user: createdByUser.trim(),
    };
  }

  return payload;
}

export async function listarCandidatos() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("candidatos")
    .select(CANDIDATO_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CandidatoRow[]).map(rowToCandidato);
}

export async function crearCandidato(values: CandidatoFormValues, createdByUser?: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("candidatos")
    .insert({
      ...formToPayload(values, createdByUser),
      activo: true,
    })
    .select(CANDIDATO_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToCandidato(data as CandidatoRow);
}

export async function actualizarCandidato(id: string, values: CandidatoFormValues) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("candidatos")
    .update(formToPayload(values))
    .eq("id", id)
    .select(CANDIDATO_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToCandidato(data as CandidatoRow);
}

export async function eliminarCandidato(id: string) {
  const client = requireSupabase();
  const { error } = await client.from("candidatos").delete().eq("id", id);

  if (error) {
    throw new Error(normalizeCandidatoError(error.message));
  }
}

function normalizeCandidatoError(message: string) {
  if (message.toLowerCase().includes("voto seguro cargado")) {
    return "No se puede eliminar este candidato porque ya tiene Voto Seguro cargado.";
  }

  return message;
}
