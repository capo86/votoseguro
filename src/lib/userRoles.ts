import type { UserProfile, UserRole } from "../types/userProfile";

export const DISTRICT_ADMIN_USER_CREATION_LIMIT = 10;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  admin_distrital: "Admin distrital",
  referente: "Referente",
};

export function getUserRoleLabel(role?: UserRole | null) {
  return role ? USER_ROLE_LABELS[role] : "Referente";
}

export function isGeneralAdminProfile(profile?: UserProfile | null) {
  return profile?.role === "admin";
}

export function isDistrictAdminProfile(profile?: UserProfile | null) {
  return profile?.role === "admin_distrital";
}

export function canAccessTerritoryManagement(profile?: UserProfile | null) {
  return isGeneralAdminProfile(profile) || isDistrictAdminProfile(profile);
}
