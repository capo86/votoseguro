import type { Candidato } from "../types/candidato";
import type { UserProfile } from "../types/userProfile";

function normalizeTerritory(value?: string) {
  return value?.trim().toUpperCase() ?? "";
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
    normalizeTerritory(candidato.departamento) === normalizeTerritory(profile.departamento) &&
    normalizeTerritory(candidato.ciudad) === normalizeTerritory(profile.ciudad)
  );
}

export function filterCandidatosForProfile(candidatos: Candidato[], profile: UserProfile | null) {
  return candidatos.filter((candidato) => isCandidateVisibleForProfile(candidato, profile));
}
