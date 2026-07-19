export type CandidatoTipoCodigo = "PPC" | "ALIANZA";

export interface CandidatoTipo {
  codigo: CandidatoTipoCodigo;
  nombre: "PPC" | "Alianza";
}

export interface Candidato {
  id: string;
  nombreCandidato: string;
  tipo: CandidatoTipo;
  cargo?: string;
  numeroLista?: string;
  localidad?: string;
  departamento?: string;
  ciudad?: string;
  observaciones?: string;
  fotoUrl?: string;
  activo: boolean;
  createdByUser?: string;
  createdAt?: string;
  updatedAt?: string;
}
