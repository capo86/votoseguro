import type { Candidato } from "../types/candidato";

export type CandidateElectionRole = "concejal" | "intendente";

export function normalizeCandidateCargo(value?: string) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function getCandidateElectionRole(candidato: Candidato): CandidateElectionRole {
  const cargo = normalizeCandidateCargo(candidato.cargo);

  if (cargo.includes("INTENDENTE")) {
    return "intendente";
  }

  return "concejal";
}

export function filterCandidatesByElectionRole(
  candidatos: Candidato[],
  role: CandidateElectionRole,
) {
  return candidatos.filter((candidato) => getCandidateElectionRole(candidato) === role);
}
