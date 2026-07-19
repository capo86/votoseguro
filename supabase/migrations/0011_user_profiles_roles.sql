set statement_timeout = 0;

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  cedula text not null unique,
  padron_ogc_fid integer,
  padron_cedula numeric,
  nombre text,
  apellido text,
  nombre_apellido text not null,
  sexo text,
  fecha_nacimiento date,
  fecha_inscripcion date,
  depart numeric,
  departamento text not null,
  distrito numeric,
  ciudad text not null,
  zona numeric,
  zona_descripcion text,
  local numeric,
  local_descripcion text,
  localidad text,
  role text not null default 'referente',
  estado text not null default 'activo',
  padron_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_cedula_digits_chk check (cedula ~ '^[0-9]{5,10}$'),
  constraint user_profiles_role_chk check (role in ('admin', 'referente')),
  constraint user_profiles_estado_chk check (estado in ('activo', 'inactivo'))
);

create index if not exists user_profiles_role_idx
  on public.user_profiles (role);

create index if not exists user_profiles_estado_idx
  on public.user_profiles (estado);

create index if not exists user_profiles_territorio_idx
  on public.user_profiles (departamento, ciudad, localidad);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

grant select, insert, update, delete on table public.user_profiles to authenticated;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_profiles
  where auth_user_id = auth.uid()
    and estado = 'activo'
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_role() to service_role;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

drop policy if exists "Usuarios pueden leer su perfil o admins todos" on public.user_profiles;
drop policy if exists "Admins pueden insertar perfiles" on public.user_profiles;
drop policy if exists "Admins pueden actualizar perfiles" on public.user_profiles;
drop policy if exists "Admins pueden eliminar perfiles" on public.user_profiles;

create policy "Usuarios pueden leer su perfil o admins todos"
  on public.user_profiles
  for select
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

create policy "Admins pueden insertar perfiles"
  on public.user_profiles
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins pueden actualizar perfiles"
  on public.user_profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins pueden eliminar perfiles"
  on public.user_profiles
  for delete
  to authenticated
  using (public.is_admin());

alter table public.votoseguro
  add column if not exists loaded_by_cedula text,
  add column if not exists loaded_by_nombre text,
  add column if not exists loaded_by_role text,
  add column if not exists loaded_by_departamento text,
  add column if not exists loaded_by_ciudad text,
  add column if not exists loaded_by_localidad text;

create index if not exists votoseguro_loaded_by_territorio_idx
  on public.votoseguro (loaded_by_departamento, loaded_by_ciudad, loaded_by_localidad);

drop policy if exists "Equipo autenticado puede leer voto seguro" on public.votoseguro;
drop policy if exists "Equipo autenticado puede insertar voto seguro propio" on public.votoseguro;
drop policy if exists "Equipo autenticado puede actualizar voto seguro propio" on public.votoseguro;
drop policy if exists "Equipo autenticado puede eliminar voto seguro propio" on public.votoseguro;
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
    or (public.current_user_role() = 'referente' and loaded_by = auth.uid())
  );

create policy "Perfiles activos insertan voto seguro propio"
  on public.votoseguro
  for insert
  to authenticated
  with check (
    loaded_by = auth.uid()
    and public.current_user_role() in ('admin', 'referente')
  );

create policy "Perfiles activos actualizan voto seguro autorizado"
  on public.votoseguro
  for update
  to authenticated
  using (
    public.is_admin()
    or (public.current_user_role() = 'referente' and loaded_by = auth.uid())
  )
  with check (
    public.is_admin()
    or (public.current_user_role() = 'referente' and loaded_by = auth.uid())
  );

create policy "Perfiles activos eliminan voto seguro autorizado"
  on public.votoseguro
  for delete
  to authenticated
  using (
    public.is_admin()
    or (public.current_user_role() = 'referente' and loaded_by = auth.uid())
  );

drop policy if exists "Equipo autenticado puede administrar candidatos" on public.candidatos;
drop policy if exists "Publico puede ver candidatos activos" on public.candidatos;
revoke select on table public.candidatos from anon;

drop policy if exists "Perfiles activos pueden leer candidatos" on public.candidatos;
drop policy if exists "Admins pueden insertar candidatos" on public.candidatos;
drop policy if exists "Admins pueden actualizar candidatos" on public.candidatos;
drop policy if exists "Admins pueden eliminar candidatos" on public.candidatos;

create policy "Perfiles activos pueden leer candidatos"
  on public.candidatos
  for select
  to authenticated
  using (public.current_user_role() in ('admin', 'referente'));

create policy "Admins pueden insertar candidatos"
  on public.candidatos
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins pueden actualizar candidatos"
  on public.candidatos
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins pueden eliminar candidatos"
  on public.candidatos
  for delete
  to authenticated
  using (public.is_admin());

comment on table public.user_profiles is
  'Perfil operativo vinculado a Auth. Permite login por cedula visible, roles y territorio.';

comment on column public.user_profiles.role is
  'Perfil operativo: admin o referente.';

comment on column public.user_profiles.estado is
  'Estado operativo: activo o inactivo.';
