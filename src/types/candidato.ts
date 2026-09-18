import type { PadronResponse } from "./votante";

export type CandidatoTipoCodigo = "PPC" | "ALIANZA";

export interface CandidatoTipo {
  codigo: CandidatoTipoCodigo;
  nombre: "PPC" | "Alianza";
}

export interface Candidato {
  id: string;
  cedula?: string;
  nombreCandidato: string;
  tipo: CandidatoTipo;
  cargo?: string;
  numeroLista?: string;
  numeroOrden?: string;
  localidad?: string;
  departamento?: string;
  ciudad?: string;
  padronOgcFid?: number;
  padronSnapshot?: PadronResponse;
  observaciones?: string;
  fotoUrl?: string;
  activo: boolean;
  createdByUser?: string;
  createdAt?: string;
  updatedAt?: string;
}
