import type { PadronResponse } from "../types/votante";

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

  return Object.values(parsed).every(Boolean) ? parsed : null;
}

export async function buscarPorCedula(cedula: string): Promise<PadronResponse> {
  const normalizedCedula = normalizeCedula(cedula);
  const apiUrl = import.meta.env.VITE_PADRON_API_URL?.trim();

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
