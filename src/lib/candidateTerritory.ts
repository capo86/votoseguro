import type { Candidato } from "../types/candidato";
import type { UserProfile } from "../types/userProfile";

export function normalizeTerritory(value?: string) {
  return (
    value
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase() ?? ""
  );
}

export function territoriesMatch(left?: string, right?: string) {
  return normalizeTerritory(left) === normalizeTerritory(right);
}

export function isCandidateVisibleForProfile(candidato: Candidato, profile: UserProfile | null) {
  if (!profile) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  return (
    candidato.activo &&
    territoriesMatch(candidato.departamento, profile.departamento) &&
    territoriesMatch(candidato.ciudad, profile.ciudad)
  );
}

export function filterCandidatosForProfile(candidatos: Candidato[], profile: UserProfile | null) {
  return candidatos.filter((candidato) => isCandidateVisibleForProfile(candidato, profile));
}

export function isCandidateVisibleForVoter(
  candidato: Candidato,
  voterTerritory: { departamento?: string; distrito?: string },
) {
  return (
    candidato.activo &&
    territoriesMatch(candidato.departamento, voterTerritory.departamento) &&
    territoriesMatch(candidato.ciudad, voterTerritory.distrito)
  );
}

export function filterCandidatosForVoter(
  candidatos: Candidato[],
  voterTerritory: { departamento?: string; distrito?: string },
) {
  if (!voterTerritory.departamento || !voterTerritory.distrito) {
    return [];
  }

  return candidatos.filter((candidato) => isCandidateVisibleForVoter(candidato, voterTerritory));
}
