create extension if not exists pgcrypto;

create table if not exists public.votoseguro (
  id uuid primary key default gen_random_uuid(),
  cedula text not null,
  padron_ogc_fid integer,
  padron_cedula numeric,
  nombre text,
  apellido text,
  nombre_apellido text not null,
  sexo text,
  fecha_nacimiento date,
  fecha_inscripcion date,
  depart numeric,
  departamento text,
  distrito numeric,
  distrito_descripcion text,
  zona numeric,
  zona_descripcion text,
  local numeric,
  local_descripcion text,
  telefono text not null,
  ubicacion_lat double precision not null,
  ubicacion_lng double precision not null,
  candidato_id uuid references public.candidatos(id) on delete set null,
  candidato_nombre text not null,
  candidato_numero_lista text,
  candidato_cargo text,
  candidato_departamento text,
  candidato_ciudad text,
  candidato_localidad text,
  source text not null default 'padron_regciv',
  estado text not null default 'activo',
  padron_snapshot jsonb not null default '{}'::jsonb,
  candidato_snapshot jsonb not null default '{}'::jsonb,
  loaded_by uuid default auth.uid() references auth.users(id) on delete set null,
  loaded_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists votoseguro_cedula_idx
  on public.votoseguro (cedula);

create index if not exists votoseguro_candidato_idx
  on public.votoseguro (candidato_id);

create index if not exists votoseguro_loaded_by_idx
  on public.votoseguro (loaded_by);

create index if not exists votoseguro_created_at_idx
  on public.votoseguro (created_at desc);

create index if not exists votoseguro_estado_idx
  on public.votoseguro (estado);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_votoseguro_updated_at on public.votoseguro;
create trigger trg_votoseguro_updated_at
before update on public.votoseguro
for each row
execute function public.set_updated_at();

alter table public.votoseguro enable row level security;

grant select, insert, update, delete on table public.votoseguro to authenticated;

drop policy if exists "Equipo autenticado puede leer voto seguro" on public.votoseguro;
create policy "Equipo autenticado puede leer voto seguro"
  on public.votoseguro
  for select
  to authenticated
  using (true);

drop policy if exists "Equipo autenticado puede insertar voto seguro propio" on public.votoseguro;
create policy "Equipo autenticado puede insertar voto seguro propio"
  on public.votoseguro
  for insert
  to authenticated
  with check (loaded_by = auth.uid());

drop policy if exists "Equipo autenticado puede actualizar voto seguro" on public.votoseguro;
create policy "Equipo autenticado puede actualizar voto seguro"
  on public.votoseguro
  for update
  to authenticated
  using (true)
  with check (loaded_by = auth.uid());

drop policy if exists "Equipo autenticado puede eliminar voto seguro" on public.votoseguro;
create policy "Equipo autenticado puede eliminar voto seguro"
  on public.votoseguro
  for delete
  to authenticated
  using (true);

comment on table public.votoseguro is
  'Snapshot operativo de Voto Seguro. Preserva el padron, candidato, usuario y ubicacion cargados en el momento.';
