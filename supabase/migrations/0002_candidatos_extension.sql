create extension if not exists pgcrypto;

alter table public.candidatos
  add column if not exists numero_lista text,
  add column if not exists localidad text,
  add column if not exists departamento text,
  add column if not exists ciudad text,
  add column if not exists observaciones text,
  add column if not exists creado_por text,
  add column if not exists created_by_user text,
  add column if not exists updated_at timestamptz;

update public.candidatos
set updated_at = coalesce(updated_at, created_at)
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
