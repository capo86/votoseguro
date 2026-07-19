create extension if not exists pgcrypto;

create table if not exists public.candidatos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cargo text,
  numero_lista text,
  localidad text,
  departamento text,
  ciudad text,
  foto_url text,
  observaciones text,
  activo boolean default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_by_user text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.candidatos
  add column if not exists cargo text,
  add column if not exists numero_lista text,
  add column if not exists localidad text,
  add column if not exists departamento text,
  add column if not exists ciudad text,
  add column if not exists foto_url text,
  add column if not exists observaciones text,
  add column if not exists activo boolean default true,
  add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null,
  add column if not exists created_by_user text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.candidatos
  alter column activo set default true,
  alter column created_by set default auth.uid(),
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.candidatos
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_candidatos_updated_at on public.candidatos;
create trigger trg_candidatos_updated_at
before update on public.candidatos
for each row
execute function public.set_updated_at();

alter table public.candidatos enable row level security;

grant select on table public.candidatos to anon;
grant select, insert, update, delete on table public.candidatos to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidatos'
      and policyname = 'Publico puede ver candidatos activos'
  ) then
    create policy "Publico puede ver candidatos activos"
      on public.candidatos
      for select
      to anon
      using (activo = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'candidatos'
      and policyname = 'Equipo autenticado puede administrar candidatos'
  ) then
    create policy "Equipo autenticado puede administrar candidatos"
      on public.candidatos
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end;
$$;
