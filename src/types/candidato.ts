export interface Candidato {
  id: string;
  nombreCandidato: string;
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
