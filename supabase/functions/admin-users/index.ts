import { createClient } from "npm:@supabase/supabase-js@2";

type UserRole = "admin" | "referente";
type UserStatus = "activo" | "inactivo";

interface AdminRequest {
  action: "lookup-padron" | "create" | "update" | "reset-password";
  payload?: Record<string, unknown>;
}

interface PadronRow {
  ogc_fid: number | null;
  cedula: number | string | null;
  nombre: string | null;
  apellido: string | null;
  nombre_apellido: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null;
  fecha_inscripcion: string | null;
  depart: number | null;
  departamento: string | null;
  distrito: number | null;
  distrito_descripcion: string | null;
  zona: number | null;
  zona_descripcion: string | null;
  local: number | null;
  local_descripcion: string | null;
}

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

function normalizeCedula(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function toTrimmedString(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

function authEmailFromCedula(cedula: string) {
  return `${cedula}@votoseguro.local`;
}

function assertCedula(cedula: string) {
  if (!/^\d{5,10}$/.test(cedula)) {
    throw new HttpError(400, "Ingresa una cedula valida.");
  }
}

function assertPassword(value: unknown) {
  const password = toTrimmedString(value);

  if (!password || password.length < 6) {
    throw new HttpError(400, "La contraseña debe tener al menos 6 caracteres.");
  }

  return password;
}

function assertRole(value: unknown): UserRole {
  if (value === "admin" || value === "referente") {
    return value;
  }

  throw new HttpError(400, "Selecciona un perfil valido.");
}

function assertStatus(value: unknown): UserStatus {
  if (value === "activo" || value === "inactivo") {
    return value;
  }

  throw new HttpError(400, "Selecciona un estado valido.");
}

function getStringPayload(payload: Record<string, unknown>, key: string) {
  return toTrimmedString(payload[key]);
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(500, "El servicio de usuarios no esta configurado.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createUserClient(authorization: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !publishableKey) {
    throw new HttpError(500, "El servicio de usuarios no esta configurado.");
  }

  return createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
}

async function requireAdmin(req: Request, serviceClient: ReturnType<typeof createServiceClient>) {
  const authorization = req.headers.get("Authorization");

  if (!authorization) {
    throw new HttpError(401, "Sesion requerida.");
  }

  const userClient = createUserClient(authorization);
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    throw new HttpError(401, "Sesion invalida.");
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("user_profiles")
    .select("auth_user_id,role,estado")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, profileError.message);
  }

  if (!profile || profile.estado !== "activo" || profile.role !== "admin") {
    throw new HttpError(403, "Necesitas perfil administrador.");
  }

  return user;
}

async function lookupPadron(serviceClient: ReturnType<typeof createServiceClient>, cedula: string) {
  assertCedula(cedula);

  const { data, error } = await serviceClient.rpc("buscar_padron_por_cedula", {
    p_cedula: Number(cedula),
  });

  if (error) {
    throw new HttpError(500, error.message);
  }

  const row = (data?.[0] ?? null) as PadronRow | null;

  if (!row?.nombre_apellido) {
    throw new HttpError(404, "No se encontro una persona con esa cedula.");
  }

  return row;
}

async function resolveTerritory(
  serviceClient: ReturnType<typeof createServiceClient>,
  departamento: string,
  ciudad: string,
) {
  const { data: dep, error: depError } = await serviceClient
    .from("staging_dep")
    .select("depart,descrip")
    .eq("descrip", departamento)
    .neq("depart", 18)
    .maybeSingle();

  if (depError) {
    throw new HttpError(500, depError.message);
  }

  if (!dep) {
    throw new HttpError(400, "Selecciona un departamento de Paraguay.");
  }

  const { data: dis, error: disError } = await serviceClient
    .from("staging_dis")
    .select("distrito,descrip")
    .eq("depart", dep.depart)
    .eq("descrip", ciudad)
    .maybeSingle();

  if (disError) {
    throw new HttpError(500, disError.message);
  }

  if (!dis) {
    throw new HttpError(400, "Selecciona una ciudad valida para el departamento.");
  }

  return {
    ciudad: dis.descrip as string,
    depart: dep.depart as number,
    departamento: dep.descrip as string,
    distrito: dis.distrito as number,
  };
}

async function buildProfilePayload(
  serviceClient: ReturnType<typeof createServiceClient>,
  padron: PadronRow,
  payload: Record<string, unknown>,
) {
  const departamento = getStringPayload(payload, "departamento") ?? padron.departamento;
  const ciudad = getStringPayload(payload, "ciudad") ?? padron.distrito_descripcion;

  if (!departamento || !ciudad) {
    throw new HttpError(400, "Selecciona departamento y ciudad.");
  }

  const territory = await resolveTerritory(serviceClient, departamento, ciudad);

  return {
    apellido: padron.apellido,
    ciudad: territory.ciudad,
    depart: territory.depart,
    departamento: territory.departamento,
    distrito: territory.distrito,
    estado: assertStatus(payload.estado ?? "activo"),
    fecha_inscripcion: padron.fecha_inscripcion,
    fecha_nacimiento: padron.fecha_nacimiento,
    local: padron.local,
    local_descripcion: padron.local_descripcion,
    localidad: getStringPayload(payload, "localidad"),
    nombre: padron.nombre,
    nombre_apellido: padron.nombre_apellido,
    padron_cedula: padron.cedula,
    padron_ogc_fid: padron.ogc_fid,
    padron_snapshot: padron,
    role: assertRole(payload.role ?? "referente"),
    sexo: padron.sexo,
    zona: padron.zona,
    zona_descripcion: padron.zona_descripcion,
  };
}

async function createProfile(
  serviceClient: ReturnType<typeof createServiceClient>,
  callerId: string,
  payload: Record<string, unknown>,
) {
  const cedula = normalizeCedula(payload.cedula);
  assertCedula(cedula);
  const password = assertPassword(payload.password);
  const padron = await lookupPadron(serviceClient, cedula);
  const profilePayload = await buildProfilePayload(serviceClient, padron, payload);
  const email = authEmailFromCedula(cedula);

  const { data: existingProfile, error: existingError } = await serviceClient
    .from("user_profiles")
    .select("id")
    .eq("cedula", cedula)
    .maybeSingle();

  if (existingError) {
    throw new HttpError(500, existingError.message);
  }

  if (existingProfile) {
    throw new HttpError(409, "Ya existe un usuario con esa cedula.");
  }

  const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
    app_metadata: {
      role: profilePayload.role,
    },
    email,
    email_confirm: true,
    password,
    user_metadata: {
      cedula,
      nombre_apellido: profilePayload.nombre_apellido,
    },
  });

  if (createError || !createdUser.user) {
    throw new HttpError(400, createError?.message ?? "No se pudo crear el usuario.");
  }

  const { data: profile, error: insertError } = await serviceClient
    .from("user_profiles")
    .insert({
      ...profilePayload,
      auth_user_id: createdUser.user.id,
      cedula,
      created_by: callerId,
      updated_by: callerId,
    })
    .select("*")
    .single();

  if (insertError) {
    await serviceClient.auth.admin.deleteUser(createdUser.user.id, true);
    throw new HttpError(500, insertError.message);
  }

  return profile;
}

async function updateProfile(
  serviceClient: ReturnType<typeof createServiceClient>,
  callerId: string,
  payload: Record<string, unknown>,
) {
  const profileId = getStringPayload(payload, "id");

  if (!profileId) {
    throw new HttpError(400, "Falta el usuario a actualizar.");
  }

  const { data: currentProfile, error: currentError } = await serviceClient
    .from("user_profiles")
    .select("id,auth_user_id,cedula,nombre_apellido,role,estado")
    .eq("id", profileId)
    .maybeSingle();

  if (currentError) {
    throw new HttpError(500, currentError.message);
  }

  if (!currentProfile) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  if (
    currentProfile.auth_user_id === callerId &&
    ((payload.role && payload.role !== currentProfile.role) ||
      (payload.estado && payload.estado !== currentProfile.estado))
  ) {
    throw new HttpError(400, "No puedes cambiar tu propio perfil o estado.");
  }

  const role = payload.role ? assertRole(payload.role) : undefined;
  const estado = payload.estado ? assertStatus(payload.estado) : undefined;
  const departamento = getStringPayload(payload, "departamento");
  const ciudad = getStringPayload(payload, "ciudad");
  const updatePayload: Record<string, unknown> = {
    updated_by: callerId,
  };

  if (role) {
    updatePayload.role = role;
  }

  if (estado) {
    updatePayload.estado = estado;
  }

  if (departamento || ciudad) {
    if (!departamento || !ciudad) {
      throw new HttpError(400, "Selecciona departamento y ciudad.");
    }

    const territory = await resolveTerritory(serviceClient, departamento, ciudad);
    updatePayload.departamento = territory.departamento;
    updatePayload.ciudad = territory.ciudad;
    updatePayload.depart = territory.depart;
    updatePayload.distrito = territory.distrito;
  }

  if ("localidad" in payload) {
    updatePayload.localidad = getStringPayload(payload, "localidad");
  }

  const { data: profile, error: updateError } = await serviceClient
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", profileId)
    .select("*")
    .single();

  if (updateError) {
    throw new HttpError(500, updateError.message);
  }

  if (role) {
    await serviceClient.auth.admin.updateUserById(currentProfile.auth_user_id, {
      app_metadata: {
        role,
      },
      user_metadata: {
        cedula: currentProfile.cedula,
        nombre_apellido: currentProfile.nombre_apellido,
      },
    });
  }

  return profile;
}

async function resetPassword(
  serviceClient: ReturnType<typeof createServiceClient>,
  payload: Record<string, unknown>,
) {
  const profileId = getStringPayload(payload, "id");
  const password = assertPassword(payload.password);

  if (!profileId) {
    throw new HttpError(400, "Falta el usuario.");
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("user_profiles")
    .select("auth_user_id")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, profileError.message);
  }

  if (!profile) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  const { error } = await serviceClient.auth.admin.updateUserById(profile.auth_user_id, {
    password,
  });

  if (error) {
    throw new HttpError(500, error.message);
  }

  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Metodo no permitido." }, 405);
  }

  try {
    const serviceClient = createServiceClient();
    const caller = await requireAdmin(req, serviceClient);
    const body = (await req.json()) as AdminRequest;
    const payload = body.payload ?? {};

    if (body.action === "lookup-padron") {
      const cedula = normalizeCedula(payload.cedula);
      const padron = await lookupPadron(serviceClient, cedula);
      return jsonResponse({ data: padron });
    }

    if (body.action === "create") {
      const profile = await createProfile(serviceClient, caller.id, payload);
      return jsonResponse({ data: profile }, 201);
    }

    if (body.action === "update") {
      const profile = await updateProfile(serviceClient, caller.id, payload);
      return jsonResponse({ data: profile });
    }

    if (body.action === "reset-password") {
      const result = await resetPassword(serviceClient, payload);
      return jsonResponse({ data: result });
    }

    return jsonResponse({ error: "Accion no soportada." }, 400);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    return jsonResponse(
      { error: error instanceof Error ? error.message : "No se pudo procesar la solicitud." },
      500,
    );
  }
});
