export interface PadronResponse {
  cedula: string;
  nombreApellido: string;
  departamento: string;
  distrito: string;
  zona: string;
  local: string;
}

export interface Ubicacion {
  lat: number;
  lng: number;
}

export interface Votante {
  id?: string;
  cedula: string;
  nombreApellido: string;
  departamento: string;
  distrito: string;
  zona: string;
  local: string;
  telefono: string;
  ubicacion?: Ubicacion;
  candidatoId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistroVotanteFormValues {
  cedula: string;
  nombreApellido: string;
  departamento: string;
  distrito: string;
  zona: string;
  local: string;
  telefono: string;
  candidatoId: string;
  ubicacion?: Ubicacion;
}

export type PadronLookupStatus = "idle" | "loading" | "found" | "not_found" | "error";
