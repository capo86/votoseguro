import type { PadronResponse } from "../types/votante";
import { supabase } from "./supabaseClient";

const MOCK_PADRON: Record<string, PadronResponse> = {
  "1234567": {
    cedula: "1234567",
    nombreApellido: "Mariana Acosta Benitez",
    departamento: "Central",
    distrito: "Fernando de la Mora",
    zona: "Zona Norte",
    local: "Escuela Basica Republica Argentina",
  },
  "2345678": {
    cedula: "2345678",
    nombreApellido: "Carlos Daniel Vera Duarte",
    departamento: "Asuncion",
    distrito: "Santísima Trinidad",
    zona: "Barrio Jara",
    local: "Colegio Nacional Las Residentas",
  },
  "3456789": {
    cedula: "3456789",
    nombreApellido: "Lorena Paola Rios Galeano",
    departamento: "Central",
    distrito: "San Lorenzo",
    zona: "Reducto",
    local: "Colegio Saturio Rios",
  },
};

type UnknownRecord = Record<string, unknown>;

interface PadronRpcRow {
  cedula: number | string | null;
  apellido: string | null;
  comunidad_indigena: string | null;
  depart: number | string | null;
  departamento: string | null;
  discapacidad: string | null;
  distrito: number | string | null;
  distrito_descripcion: string | null;
  es_indigena: string | null;
  fecha_inscripcion: string | null;
  fecha_nacimiento: string | null;
  id_nacion: number | string | null;
  local: number | string | null;
  local_descripcion: string | null;
  local_votacion: string | null;
  mesa: number | string | null;
  nacionalidad: string | null;
  nombre: string | null;
  nombre_apellido: string | null;
  ogc_fid: number | null;
  orden: number | string | null;
  pueblo_indigena: string | null;
  sexo: string | null;
  tiene_discapacidad: string | null;
  zona: number | string | null;
  zona_descripcion: string | null;
}

export class PadronNotFoundError extends Error {
  constructor() {
    super("No se encontro una persona con esa cedula.");
    this.name = "PadronNotFoundError";
  }
}

function normalizeCedula(cedula: string) {
  return cedula.replace(/\D/g, "");
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function parsePadronResponse(value: unknown): PadronResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const parsed = {
    cedula: readString(value, ["cedula", "documento"]),
    nombreApellido: readString(value, ["nombreApellido", "nombre_apellido", "nombre"]),
    departamento: readString(value, ["departamento"]),
    distrito: readString(value, ["distrito"]),
    zona: readString(value, ["zona"]),
    local: readString(value, ["local", "local_votacion"]),
  };

  return parsed.cedula &&
    parsed.departamento &&
    parsed.distrito &&
    parsed.local &&
    parsed.nombreApellido &&
    parsed.zona
    ? parsed
    : null;
}

function parsePadronRpcRow(row: PadronRpcRow): PadronResponse | null {
  const parsed = {
    cedula: row.cedula ? String(row.cedula) : "",
    apellido: row.apellido?.trim() || undefined,
    comunidadIndigena: row.comunidad_indigena?.trim() || undefined,
    departamentoCodigo: row.depart ? String(row.depart) : undefined,
    departamento: row.departamento?.trim() || (row.depart ? String(row.depart) : ""),
    discapacidad: row.discapacidad?.trim() || undefined,
    distritoCodigo: row.distrito ? String(row.distrito) : undefined,
    distrito: row.distrito_descripcion?.trim() || (row.distrito ? String(row.distrito) : ""),
    esIndigena: row.es_indigena?.trim() || undefined,
    fechaInscripcion: row.fecha_inscripcion ?? undefined,
    fechaNacimiento: row.fecha_nacimiento ?? undefined,
    localCodigo: row.local ? String(row.local) : undefined,
    local: row.local_descripcion?.trim() || (row.local ? String(row.local) : ""),
    localVotacion: row.local_votacion?.trim() || row.local_descripcion?.trim() || undefined,
    mesa: row.mesa ? String(row.mesa) : undefined,
    nacionalidad: row.nacionalidad?.trim() || undefined,
    nombre: row.nombre?.trim() || undefined,
    nombreApellido: row.nombre_apellido?.trim() ?? "",
    orden: row.orden ? String(row.orden) : undefined,
    padronOgcFid: row.ogc_fid ?? undefined,
    puebloIndigena: row.pueblo_indigena?.trim() || undefined,
    sexo: row.sexo?.trim() || undefined,
    tieneDiscapacidad: row.tiene_discapacidad?.trim() || undefined,
    zonaCodigo: row.zona ? String(row.zona) : undefined,
    zona: row.zona_descripcion?.trim() || (row.zona ? String(row.zona) : ""),
  };

  return parsed.cedula &&
    parsed.departamento &&
    parsed.distrito &&
    parsed.local &&
    parsed.nombreApellido &&
    parsed.zona
    ? parsed
    : null;
}

async function buscarEnSupabase(normalizedCedula: string): Promise<PadronResponse | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("buscar_padron_por_cedula", {
    p_cedula: Number(normalizedCedula),
  });

  if (error) {
    throw new Error(error.message || "No se pudo consultar el padron electoral.");
  }

  const firstRow = Array.isArray(data) ? (data[0] as PadronRpcRow | undefined) : undefined;

  if (!firstRow) {
    throw new PadronNotFoundError();
  }

  const parsed = parsePadronRpcRow(firstRow);

  if (!parsed) {
    throw new Error("La respuesta del padron no tiene el formato esperado.");
  }

  return parsed;
}

export async function buscarPorCedula(cedula: string): Promise<PadronResponse> {
  const normalizedCedula = normalizeCedula(cedula);
  const apiUrl = import.meta.env.VITE_PADRON_API_URL?.trim();
  const supabaseResult = await buscarEnSupabase(normalizedCedula);

  if (supabaseResult) {
    return supabaseResult;
  }

  if (!apiUrl) {
    await wait(650);
    const mockRecord = MOCK_PADRON[normalizedCedula];

    if (!mockRecord) {
      throw new PadronNotFoundError();
    }

    return mockRecord;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cedula: normalizedCedula }),
  });

  if (response.status === 404) {
    throw new PadronNotFoundError();
  }

  if (!response.ok) {
    throw new Error("No se pudo consultar el padron electoral.");
  }

  const data: unknown = await response.json();
  const parsed = parsePadronResponse(data);

  if (!parsed) {
    throw new Error("La respuesta del padron no tiene el formato esperado.");
  }

  return parsed;
}
