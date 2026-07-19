create or replace function public.admin_votoseguro_por_territorio()
returns table (
  departamento text,
  distrito text,
  cantidad bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(trim(v.departamento), ''), 'SIN DEPARTAMENTO') as departamento,
    coalesce(nullif(trim(v.distrito_descripcion), ''), 'SIN DISTRITO') as distrito,
    count(*) as cantidad
  from public.votoseguro as v
  where public.is_admin()
  group by 1, 2
  order by 1, 3 desc, 2;
$$;

create or replace function public.admin_votoseguro_top_usuarios()
returns table (
  auth_user_id uuid,
  nombre text,
  cedula text,
  departamento text,
  ciudad text,
  localidad text,
  cantidad bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.loaded_by as auth_user_id,
    coalesce(nullif(trim(v.loaded_by_nombre), ''), profile.nombre_apellido, 'Usuario historico') as nombre,
    coalesce(nullif(trim(v.loaded_by_cedula), ''), profile.cedula, '-') as cedula,
    coalesce(nullif(trim(v.loaded_by_departamento), ''), profile.departamento, '-') as departamento,
    coalesce(nullif(trim(v.loaded_by_ciudad), ''), profile.ciudad, '-') as ciudad,
    coalesce(nullif(trim(v.loaded_by_localidad), ''), profile.localidad, '-') as localidad,
    count(*) as cantidad
  from public.votoseguro as v
  left join public.user_profiles as profile
    on profile.auth_user_id = v.loaded_by
  where public.is_admin()
  group by 1, 2, 3, 4, 5, 6
  order by cantidad desc, nombre
  limit 10;
$$;

revoke all on function public.admin_votoseguro_por_territorio() from public;
grant execute on function public.admin_votoseguro_por_territorio() to authenticated;

revoke all on function public.admin_votoseguro_top_usuarios() from public;
grant execute on function public.admin_votoseguro_top_usuarios() to authenticated;

comment on function public.admin_votoseguro_por_territorio() is
  'Dashboard admin: cantidad de Voto Seguro por departamento y distrito.';

comment on function public.admin_votoseguro_top_usuarios() is
  'Dashboard admin: top 10 usuarios por cargas de Voto Seguro.';
