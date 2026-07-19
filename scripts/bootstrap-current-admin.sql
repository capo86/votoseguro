-- Bootstrap manual para el primer administrador.
-- Ejecutar una sola vez en el SQL editor, reemplazando los placeholders.
-- No guardar una copia editada con datos reales ni secretos.

with target_user as (
  select id
  from auth.users
  where id = '<AUTH_USER_ID>'::uuid
),
padron as (
  select *
  from public.buscar_padron_por_cedula(<CEDULA_NUMERICA>)
  limit 1
)
insert into public.user_profiles (
  auth_user_id,
  cedula,
  padron_ogc_fid,
  padron_cedula,
  nombre,
  apellido,
  nombre_apellido,
  sexo,
  fecha_nacimiento,
  fecha_inscripcion,
  depart,
  departamento,
  distrito,
  ciudad,
  zona,
  zona_descripcion,
  local,
  local_descripcion,
  localidad,
  role,
  estado,
  padron_snapshot,
  created_by,
  updated_by
)
select
  target_user.id,
  '<CEDULA_NUMERICA>',
  padron.ogc_fid,
  padron.cedula,
  padron.nombre,
  padron.apellido,
  padron.nombre_apellido,
  padron.sexo,
  padron.fecha_nacimiento,
  padron.fecha_inscripcion,
  padron.depart,
  padron.departamento,
  padron.distrito,
  padron.distrito_descripcion,
  padron.zona,
  padron.zona_descripcion,
  padron.local,
  padron.local_descripcion,
  '<LOCALIDAD_OPERATIVA>',
  'admin',
  'activo',
  to_jsonb(padron),
  target_user.id,
  target_user.id
from target_user
cross join padron
on conflict (auth_user_id) do update
set
  cedula = excluded.cedula,
  padron_ogc_fid = excluded.padron_ogc_fid,
  padron_cedula = excluded.padron_cedula,
  nombre = excluded.nombre,
  apellido = excluded.apellido,
  nombre_apellido = excluded.nombre_apellido,
  sexo = excluded.sexo,
  fecha_nacimiento = excluded.fecha_nacimiento,
  fecha_inscripcion = excluded.fecha_inscripcion,
  depart = excluded.depart,
  departamento = excluded.departamento,
  distrito = excluded.distrito,
  ciudad = excluded.ciudad,
  zona = excluded.zona,
  zona_descripcion = excluded.zona_descripcion,
  local = excluded.local,
  local_descripcion = excluded.local_descripcion,
  localidad = excluded.localidad,
  role = 'admin',
  estado = 'activo',
  padron_snapshot = excluded.padron_snapshot,
  updated_by = excluded.updated_by,
  updated_at = now();
