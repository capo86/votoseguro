export interface PadronResponse {
  cedula: string;
  padronOgcFid?: number;
  nombre?: string;
  apellido?: string;
  nombreApellido: string;
  sexo?: string;
  fechaNacimiento?: string;
  fechaInscripcion?: string;
  departamentoCodigo?: string;
  departamento: string;
  distritoCodigo?: string;
  distrito: string;
  zonaCodigo?: string;
  zona: string;
  localCodigo?: string;
  local: string;
  localVotacion?: string;
  mesa?: string;
  orden?: string;
  nacionalidad?: string;
  esIndigena?: string;
  puebloIndigena?: string;
  comunidadIndigena?: string;
  tieneDiscapacidad?: string;
  discapacidad?: string;
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
