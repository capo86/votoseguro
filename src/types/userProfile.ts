export type UserRole = "admin" | "referente";
export type UserStatus = "activo" | "inactivo";

export interface UserProfile {
  id: string;
  authUserId: string;
  cedula: string;
  padronOgcFid?: number;
  padronCedula?: string;
  nombre?: string;
  apellido?: string;
  nombreApellido: string;
  sexo?: string;
  fechaNacimiento?: string;
  fechaInscripcion?: string;
  depart?: string;
  departamento: string;
  distrito?: string;
  ciudad: string;
  zona?: string;
  zonaDescripcion?: string;
  local?: string;
  localDescripcion?: string;
  localidad?: string;
  role: UserRole;
  estado: UserStatus;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserProfileInput {
  cedula: string;
  ciudad: string;
  departamento: string;
  estado: UserStatus;
  localidad?: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserProfileInput {
  ciudad: string;
  departamento: string;
  estado: UserStatus;
  id: string;
  localidad?: string;
  role: UserRole;
}
