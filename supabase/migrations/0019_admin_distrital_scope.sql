set statement_timeout = 0;

alter table public.user_profiles
  drop constraint if exists user_profiles_role_chk;

alter table public.user_profiles
  add constraint user_profiles_role_chk
  check (role in ('admin', 'admin_distrital', 'referente'));

create or replace function public.is_admin_distrital()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin_distrital', false);
$$;

create or replace function public.current_user_has_district_scope(
  p_departamento text,
  p_ciudad text,
  p_roles text[] default array['admin_distrital']::text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles as profile
    where profile.auth_user_id = auth.uid()
      and profile.estado = 'activo'
      and profile.role = any(p_roles)
      and upper(trim(coalesce(profile.departamento, ''))) = upper(trim(coalesce(p_departamento, '')))
      and upper(trim(coalesce(profile.ciudad, ''))) = upper(trim(coalesce(p_ciudad, '')))
  );
$$;

revoke all on function public.is_admin_distrital() from public;
grant execute on function public.is_admin_distrital() to authenticated;
grant execute on function public.is_admin_distrital() to service_role;

revoke all on function public.current_user_has_district_scope(text, text, text[]) from public;
grant execute on function public.current_user_has_district_scope(text, text, text[]) to authenticated;
grant execute on function public.current_user_has_district_scope(text, text, text[]) to service_role;

drop policy if exists "Usuarios pueden leer su perfil o admins todos" on public.user_profiles;
drop policy if exists "Usuarios pueden leer perfiles autorizados" on public.user_profiles;
drop policy if exists "Admins pueden insertar perfiles" on public.user_profiles;
drop policy if exists "Gestores autorizados pueden insertar perfiles" on public.user_profiles;
drop policy if exists "Admins pueden actualizar perfiles" on public.user_profiles;
drop policy if exists "Gestores autorizados pueden actualizar perfiles" on public.user_profiles;
drop policy if exists "Admins pueden eliminar perfiles" on public.user_profiles;

create policy "Usuarios pueden leer perfiles autorizados"
  on public.user_profiles
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or public.is_admin()
    or (
      role = 'referente'
      and public.current_user_has_district_scope(departamento, ciudad, array['admin_distrital']::text[])
    )
  );

create policy "Gestores autorizados pueden insertar perfiles"
  on public.user_profiles
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      role = 'referente'
      and public.current_user_has_district_scope(departamento, ciudad, array['admin_distrital']::text[])
    )
  );

create policy "Gestores autorizados pueden actualizar perfiles"
  on public.user_profiles
  for update
  to authenticated
  using (
    public.is_admin()
    or (
      role = 'referente'
      and public.current_user_has_district_scope(departamento, ciudad, array['admin_distrital']::text[])
    )
  )
  with check (
    public.is_admin()
    or (
      role = 'referente'
      and public.current_user_has_district_scope(departamento, ciudad, array['admin_distrital']::text[])
    )
  );

create policy "Admins pueden eliminar perfiles"
  on public.user_profiles
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Perfiles activos leen voto seguro autorizado" on public.votoseguro;
drop policy if exists "Perfiles activos insertan voto seguro propio" on public.votoseguro;
drop policy if exists "Perfiles activos actualizan voto seguro autorizado" on public.votoseguro;
drop policy if exists "Perfiles activos eliminan voto seguro autorizado" on public.votoseguro;

create policy "Perfiles activos leen voto seguro autorizado"
  on public.votoseguro
  for select
  to authenticated
  using (
    public.is_admin()
    or (
      public.current_user_role() = 'referente'
      and loaded_by = auth.uid()
    )
    or public.current_user_has_district_scope(
      departamento,
      distrito_descripcion,
      array['admin_distrital']::text[]
    )
  );

create policy "Perfiles activos insertan voto seguro propio"
  on public.votoseguro
  for insert
  to authenticated
  with check (
    loaded_by = auth.uid()
    and (
      public.is_admin()
      or public.current_user_has_district_scope(
        departamento,
        distrito_descripcion,
        array['referente', 'admin_distrital']::text[]
      )
    )
  );

create policy "Perfiles activos actualizan voto seguro autorizado"
  on public.votoseguro
  for update
  to authenticated
  using (
    public.is_admin()
    or (
      public.current_user_role() = 'referente'
      and loaded_by = auth.uid()
    )
    or public.current_user_has_district_scope(
      departamento,
      distrito_descripcion,
      array['admin_distrital']::text[]
    )
  )
  with check (
    public.is_admin()
    or (
      public.current_user_role() = 'referente'
      and loaded_by = auth.uid()
      and public.current_user_has_district_scope(
        departamento,
        distrito_descripcion,
        array['referente']::text[]
      )
    )
    or public.current_user_has_district_scope(
      departamento,
      distrito_descripcion,
      array['admin_distrital']::text[]
    )
  );

create policy "Perfiles activos eliminan voto seguro autorizado"
  on public.votoseguro
  for delete
  to authenticated
  using (
    public.is_admin()
    or (
      public.current_user_role() = 'referente'
      and loaded_by = auth.uid()
    )
  );

drop policy if exists "Perfiles activos pueden leer candidatos" on public.candidatos;

create policy "Perfiles activos pueden leer candidatos"
  on public.candidatos
  for select
  to authenticated
  using (
    public.is_admin()
    or (
      activo = true
      and public.current_user_has_district_scope(
        departamento,
        ciudad,
        array['referente', 'admin_distrital']::text[]
      )
    )
  );

drop policy if exists "Authenticated users can upload candidate photos" on storage.objects;
drop policy if exists "Authenticated users can update candidate photos" on storage.objects;
drop policy if exists "Authenticated users can delete candidate photos" on storage.objects;
drop policy if exists "Admins can upload candidate photos" on storage.objects;
drop policy if exists "Admins can update candidate photos" on storage.objects;
drop policy if exists "Admins can delete candidate photos" on storage.objects;

create policy "Admins can upload candidate photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'candidate-photos'
    and public.is_admin()
  );

create policy "Admins can update candidate photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and public.is_admin()
  )
  with check (
    bucket_id = 'candidate-photos'
    and public.is_admin()
  );

create policy "Admins can delete candidate photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'candidate-photos'
    and public.is_admin()
  );

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
  where
    public.is_admin()
    or public.current_user_has_district_scope(
      v.departamento,
      v.distrito_descripcion,
      array['admin_distrital']::text[]
    )
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
  where
    public.is_admin()
    or public.current_user_has_district_scope(
      v.departamento,
      v.distrito_descripcion,
      array['admin_distrital']::text[]
    )
  group by 1, 2, 3, 4, 5, 6
  order by cantidad desc, nombre
  limit 10;
$$;

revoke all on function public.admin_votoseguro_por_territorio() from public;
grant execute on function public.admin_votoseguro_por_territorio() to authenticated;

revoke all on function public.admin_votoseguro_top_usuarios() from public;
grant execute on function public.admin_votoseguro_top_usuarios() to authenticated;

comment on column public.user_profiles.role is
  'Perfil operativo: admin, admin_distrital o referente.';

comment on function public.current_user_has_district_scope(text, text, text[]) is
  'Verifica si el usuario activo tiene alcance sobre un departamento y distrito para los roles indicados.';

comment on function public.admin_votoseguro_por_territorio() is
  'Resumen: cantidad de Voto Seguro por departamento y distrito, filtrado por alcance del usuario.';

comment on function public.admin_votoseguro_top_usuarios() is
  'Resumen: top usuarios por cargas de Voto Seguro, filtrado por alcance del usuario.';

notify pgrst, 'reload schema';
