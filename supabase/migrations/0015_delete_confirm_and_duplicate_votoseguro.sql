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
    limit 1
  ) then
    raise exception 'No se puede eliminar este candidato porque ya tiene Voto Seguro cargado.';
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_delete_candidato_with_votoseguro on public.candidatos;
create trigger trg_prevent_delete_candidato_with_votoseguro
before delete on public.candidatos
for each row
execute function public.prevent_delete_candidato_with_votoseguro();

create or replace function public.prevent_duplicate_votoseguro_cedula()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_record record;
begin
  if new.estado = 'activo' then
    select
      v.loaded_by_nombre,
      v.created_at
    into existing_record
    from public.votoseguro as v
    where v.cedula = new.cedula
      and v.estado = 'activo'
      and v.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    order by v.created_at asc
    limit 1;

    if found then
      raise exception 'Esta cedula ya fue cargada por % el %.',
        coalesce(nullif(trim(existing_record.loaded_by_nombre), ''), 'otro referente'),
        to_char(existing_record.created_at at time zone 'America/Asuncion', 'DD/MM/YYYY HH24:MI');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_duplicate_votoseguro_cedula on public.votoseguro;
create trigger trg_prevent_duplicate_votoseguro_cedula
before insert or update of cedula, estado on public.votoseguro
for each row
execute function public.prevent_duplicate_votoseguro_cedula();

create unique index if not exists votoseguro_cedula_activo_uidx
  on public.votoseguro (cedula)
  where estado = 'activo';

create or replace function public.buscar_votoseguro_existente_por_cedula(p_cedula text)
returns table (
  id uuid,
  cedula text,
  nombre_apellido text,
  loaded_by uuid,
  loaded_by_nombre text,
  loaded_by_cedula text,
  loaded_by_departamento text,
  loaded_by_ciudad text,
  loaded_by_localidad text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.id,
    v.cedula,
    v.nombre_apellido,
    v.loaded_by,
    coalesce(nullif(trim(v.loaded_by_nombre), ''), profile.nombre_apellido, 'otro referente') as loaded_by_nombre,
    coalesce(nullif(trim(v.loaded_by_cedula), ''), profile.cedula, '-') as loaded_by_cedula,
    coalesce(nullif(trim(v.loaded_by_departamento), ''), profile.departamento, '-') as loaded_by_departamento,
    coalesce(nullif(trim(v.loaded_by_ciudad), ''), profile.ciudad, '-') as loaded_by_ciudad,
    coalesce(nullif(trim(v.loaded_by_localidad), ''), profile.localidad, '-') as loaded_by_localidad,
    v.created_at
  from public.votoseguro as v
  left join public.user_profiles as profile
    on profile.auth_user_id = v.loaded_by
  where public.current_user_role() in ('admin', 'referente')
    and v.estado = 'activo'
    and v.cedula = regexp_replace(coalesce(p_cedula, ''), '\D', '', 'g')
  order by v.created_at asc
  limit 1;
$$;

revoke all on function public.buscar_votoseguro_existente_por_cedula(text) from public;
grant execute on function public.buscar_votoseguro_existente_por_cedula(text) to authenticated;

comment on function public.buscar_votoseguro_existente_por_cedula(text) is
  'Permite avisar duplicados de Voto Seguro por cedula sin exponer la grilla completa entre referentes.';
