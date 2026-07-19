alter table public.candidatos
  add column if not exists tipo jsonb not null default '{"codigo":"PPC","nombre":"PPC"}'::jsonb;

update public.candidatos
set tipo = '{"codigo":"PPC","nombre":"PPC"}'::jsonb
where tipo is null
   or tipo = '{}'::jsonb
   or tipo->>'codigo' is null;

alter table public.candidatos
  drop constraint if exists candidatos_tipo_codigo_chk;

alter table public.candidatos
  add constraint candidatos_tipo_codigo_chk
  check (tipo->>'codigo' in ('PPC', 'ALIANZA'));

comment on column public.candidatos.tipo is
  'Tipo politico del candidato. Valores operativos iniciales: PPC o ALIANZA.';

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
    coalesce(
      nullif(trim(v.loaded_by_nombre), ''),
      profile.nombre_apellido,
      nullif(trim(auth_user.raw_user_meta_data->>'nombre_apellido'), ''),
      nullif(trim(auth_user.raw_user_meta_data->>'name'), ''),
      initcap(replace(nullif(split_part(coalesce(v.loaded_by_email, auth_user.email, ''), '@', 1), ''), '.', ' ')),
      'Usuario historico'
    ) as nombre,
    coalesce(
      nullif(trim(v.loaded_by_cedula), ''),
      profile.cedula,
      nullif(trim(auth_user.raw_user_meta_data->>'cedula'), ''),
      '-'
    ) as cedula,
    coalesce(nullif(trim(v.loaded_by_departamento), ''), profile.departamento, '-') as departamento,
    coalesce(nullif(trim(v.loaded_by_ciudad), ''), profile.ciudad, '-') as ciudad,
    coalesce(nullif(trim(v.loaded_by_localidad), ''), profile.localidad, '-') as localidad,
    count(*) as cantidad
  from public.votoseguro as v
  left join public.user_profiles as profile
    on profile.auth_user_id = v.loaded_by
  left join auth.users as auth_user
    on auth_user.id = v.loaded_by
  where public.is_admin()
  group by 1, 2, 3, 4, 5, 6
  order by cantidad desc, nombre
  limit 10;
$$;

revoke all on function public.admin_votoseguro_top_usuarios() from public;
grant execute on function public.admin_votoseguro_top_usuarios() to authenticated;

comment on function public.admin_votoseguro_top_usuarios() is
  'Dashboard admin: top 10 usuarios por cargas de Voto Seguro, con fallback para cargas historicas.';
