import { supabase } from "./supabaseClient";

export interface DashboardTerritoryRow {
  cantidad: number;
  departamento: string;
  distrito: string;
}

export interface DashboardUserRow {
  authUserId?: string;
  cantidad: number;
  cedula: string;
  ciudad: string;
  departamento: string;
  localidad: string;
  nombre: string;
}

interface DashboardTerritoryRpcRow {
  cantidad: number | string;
  departamento: string | null;
  distrito: string | null;
}

interface DashboardUserRpcRow {
  auth_user_id: string | null;
  cantidad: number | string;
  cedula: string | null;
  ciudad: string | null;
  departamento: string | null;
  localidad: string | null;
  nombre: string | null;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("El servicio no esta configurado.");
  }

  return supabase;
}

function toCount(value: number | string) {
  return Number(value) || 0;
}

export async function getDashboardTerritoryRows() {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_votoseguro_por_territorio");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DashboardTerritoryRpcRow[]).map((row) => ({
    cantidad: toCount(row.cantidad),
    departamento: row.departamento ?? "SIN DEPARTAMENTO",
    distrito: row.distrito ?? "SIN DISTRITO",
  }));
}

export async function getDashboardTopUsers() {
  const client = requireSupabase();
  const { data, error } = await client.rpc("admin_votoseguro_top_usuarios");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DashboardUserRpcRow[]).map((row) => ({
    authUserId: row.auth_user_id ?? undefined,
    cantidad: toCount(row.cantidad),
    cedula: row.cedula ?? "-",
    ciudad: row.ciudad ?? "-",
    departamento: row.departamento ?? "-",
    localidad: row.localidad ?? "-",
    nombre: row.nombre ?? "Usuario historico",
  }));
}
