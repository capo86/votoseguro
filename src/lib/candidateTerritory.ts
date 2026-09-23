import type { Candidato } from "../types/candidato";
import type { UserProfile } from "../types/userProfile";
import { getCandidateElectionRole } from "./candidateCargo";

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

function normalizeCandidateKey(value?: string) {
  return normalizeTerritory(value).replace(/[^A-Z0-9]+/g, " ");
}

function normalizeCedula(value?: string) {
  return value?.replace(/\D/g, "") ?? "";
}

function hasPadronData(candidato: Candidato) {
  return Boolean(
    candidato.padronOgcFid ||
      (candidato.padronSnapshot && Object.keys(candidato.padronSnapshot).length > 0),
  );
}

function candidateSelectionKey(candidato: Candidato) {
  return [
    normalizeCandidateKey(candidato.departamento),
    normalizeCandidateKey(candidato.ciudad),
    getCandidateElectionRole(candidato),
    normalizeCandidateKey(candidato.numeroLista),
    normalizeCandidateKey(candidato.nombreCandidato),
  ].join("|");
}

function isPreferredSelectionCandidate(candidate: Candidato, current: Candidato) {
  const candidateCedula = normalizeCedula(candidate.cedula);
  const currentCedula = normalizeCedula(current.cedula);

  if (Boolean(candidateCedula) !== Boolean(currentCedula)) {
    return Boolean(candidateCedula);
  }

  if (hasPadronData(candidate) !== hasPadronData(current)) {
    return hasPadronData(candidate);
  }

  if (Boolean(candidate.numeroOrden) !== Boolean(current.numeroOrden)) {
    return Boolean(candidate.numeroOrden);
  }

  return (candidate.updatedAt ?? candidate.createdAt ?? "") > (current.updatedAt ?? current.createdAt ?? "");
}

export function dedupeCandidatosForSelection(candidatos: Candidato[]) {
  const byPersonKey = new Map<string, Candidato>();

  for (const candidato of candidatos) {
    const key = candidateSelectionKey(candidato);
    const current = byPersonKey.get(key);

    if (!current || isPreferredSelectionCandidate(candidato, current)) {
      byPersonKey.set(key, candidato);
    }
  }

  const byCedula = new Map<string, Candidato>();
  const withoutCedula: Candidato[] = [];

  for (const candidato of byPersonKey.values()) {
    const cedula = normalizeCedula(candidato.cedula);

    if (!cedula) {
      withoutCedula.push(candidato);
      continue;
    }

    const current = byCedula.get(cedula);

    if (!current || isPreferredSelectionCandidate(candidato, current)) {
      byCedula.set(cedula, candidato);
    }
  }

  return [...byCedula.values(), ...withoutCedula];
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

  return dedupeCandidatosForSelection(
    candidatos.filter((candidato) => isCandidateVisibleForVoter(candidato, voterTerritory)),
  );
}
