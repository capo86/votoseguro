alter table public.votoseguro
  add column if not exists concejal_id uuid references public.candidatos(id) on delete set null,
  add column if not exists concejal_nombre text,
  add column if not exists concejal_numero_lista text,
  add column if not exists concejal_cargo text,
  add column if not exists concejal_departamento text,
  add column if not exists concejal_ciudad text,
  add column if not exists concejal_localidad text,
  add column if not exists concejal_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists intendente_id uuid references public.candidatos(id) on delete set null,
  add column if not exists intendente_nombre text,
  add column if not exists intendente_numero_lista text,
  add column if not exists intendente_cargo text,
  add column if not exists intendente_departamento text,
  add column if not exists intendente_ciudad text,
  add column if not exists intendente_localidad text,
  add column if not exists intendente_snapshot jsonb not null default '{}'::jsonb;

update public.votoseguro
set
  concejal_id = coalesce(concejal_id, candidato_id),
  concejal_nombre = coalesce(concejal_nombre, candidato_nombre),
  concejal_numero_lista = coalesce(concejal_numero_lista, candidato_numero_lista),
  concejal_cargo = coalesce(concejal_cargo, candidato_cargo),
  concejal_departamento = coalesce(concejal_departamento, candidato_departamento),
  concejal_ciudad = coalesce(concejal_ciudad, candidato_ciudad),
  concejal_localidad = coalesce(concejal_localidad, candidato_localidad),
  concejal_snapshot = case
    when concejal_snapshot = '{}'::jsonb then candidato_snapshot
    else concejal_snapshot
  end
where candidato_id is not null
  or nullif(trim(candidato_nombre), '') is not null;

create index if not exists votoseguro_concejal_idx
  on public.votoseguro (concejal_id);

create index if not exists votoseguro_intendente_idx
  on public.votoseguro (intendente_id);

create or replace function public.prevent_delete_candidato_with_votoseguro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.votoseguro
    where candidato_id = old.id
      or concejal_id = old.id
      or intendente_id = old.id
    limit 1
  ) then
    raise exception 'No se puede eliminar este candidato porque ya tiene Voto Seguro cargado.';
  end if;

  return old;
end;
$$;

comment on column public.votoseguro.concejal_id is
  'Candidato seleccionado para el cargo Concejal/Titular en la carga de Voto Seguro.';

comment on column public.votoseguro.intendente_id is
  'Candidato seleccionado para el cargo Intendente en la carga de Voto Seguro, cuando existe en el distrito.';

notify pgrst, 'reload schema';
