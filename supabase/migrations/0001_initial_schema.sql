create extension if not exists pgcrypto;

create table if not exists public.candidatos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cargo text,
  foto_url text,
  activo boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.votantes (
  id uuid primary key default gen_random_uuid(),
  cedula text not null unique,
  nombre_apellido text not null,
  departamento text,
  distrito text,
  zona text,
  local text,
  telefono text,
  ubicacion_lat double precision,
  ubicacion_lng double precision,
  candidato_id uuid references public.candidatos(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists votantes_cedula_idx on public.votantes (cedula);
create index if not exists votantes_candidato_idx on public.votantes (candidato_id);

alter table public.candidatos enable row level security;
alter table public.votantes enable row level security;

create policy "Publico puede ver candidatos activos"
  on public.candidatos
  for select
  to anon
  using (activo = true);

create policy "Equipo autenticado puede administrar candidatos"
  on public.candidatos
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Equipo autenticado puede leer votantes"
  on public.votantes
  for select
  to authenticated
  using (true);

create policy "Equipo autenticado puede insertar votantes"
  on public.votantes
  for insert
  to authenticated
  with check (true);

create policy "Equipo autenticado puede actualizar votantes"
  on public.votantes
  for update
  to authenticated
  using (true)
  with check (true);
