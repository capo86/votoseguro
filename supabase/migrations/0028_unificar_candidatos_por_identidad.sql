set statement_timeout = 0;

create or replace function public.normalize_candidate_identity_name(p_value text)
returns text
language sql
immutable
parallel safe
as $$
  select public.normalize_candidate_match_text(
    regexp_replace(
      coalesce(p_value, ''),
      '^(DR|DRA|ABOG|ABOGADO|ABOGADA|LIC|LICDA|ING)\.?\s+',
      '',
      'i'
    )
  );
$$;

create table if not exists public.candidato_unificaciones (
  id uuid primary key default gen_random_uuid(),
  batch text not null,
  duplicate_id uuid not null,
  master_id uuid not null,
  reason text not null,
  duplicate_snapshot jsonb not null,
  master_snapshot jsonb not null,
  votos_afectados integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists candidato_unificaciones_duplicate_master_reason_uidx
  on public.candidato_unificaciones (duplicate_id, master_id, reason);

alter table public.candidato_unificaciones enable row level security;
revoke all on table public.candidato_unificaciones from anon;
revoke all on table public.candidato_unificaciones from authenticated;

create table if not exists public.votoseguro_unificacion_backup (
  id uuid primary key default gen_random_uuid(),
  batch text not null,
  votoseguro_id uuid not null,
  duplicate_id uuid not null,
  master_id uuid not null,
  matched_columns text[] not null,
  before_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists votoseguro_unificacion_backup_vote_candidate_uidx
  on public.votoseguro_unificacion_backup (batch, votoseguro_id, duplicate_id, master_id);

alter table public.votoseguro_unificacion_backup enable row level security;
revoke all on table public.votoseguro_unificacion_backup from anon;
revoke all on table public.votoseguro_unificacion_backup from authenticated;

create temporary table candidato_identity_merge_map_0028 on commit drop as
with pair_candidates as (
  select
    duplicate_candidate.id as duplicate_id,
    master_candidate.id as master_id,
    'identidad_nombre_territorio_cargo'::text as reason,
    to_jsonb(duplicate_candidate) as duplicate_snapshot,
    to_jsonb(master_candidate) as master_snapshot,
    (
      select count(*)
      from public.votoseguro as voto
      where voto.candidato_id = duplicate_candidate.id
        or voto.concejal_id = duplicate_candidate.id
        or voto.intendente_id = duplicate_candidate.id
    )::integer as votos_afectados
  from public.candidatos as duplicate_candidate
  join public.candidatos as master_candidate
    on duplicate_candidate.id <> master_candidate.id
   and duplicate_candidate.activo = true
   and master_candidate.activo = true
   and nullif(regexp_replace(coalesce(duplicate_candidate.cedula, ''), '\D', '', 'g'), '') is null
   and nullif(regexp_replace(coalesce(master_candidate.cedula, ''), '\D', '', 'g'), '') is not null
   and nullif(trim(coalesce(duplicate_candidate.numero_orden, '')), '') is null
   and nullif(trim(coalesce(master_candidate.numero_orden, '')), '') is not null
   and coalesce(master_candidate.created_by_user, '') = 'import candidatos 2026'
   and (
     master_candidate.padron_ogc_fid is not null
     or coalesce(master_candidate.padron_snapshot <> '{}'::jsonb, false)
   )
   and public.normalize_candidate_match_text(duplicate_candidate.departamento)
     = public.normalize_candidate_match_text(master_candidate.departamento)
   and public.normalize_candidate_match_text(duplicate_candidate.ciudad)
     = public.normalize_candidate_match_text(master_candidate.ciudad)
   and public.candidato_match_role(duplicate_candidate.cargo)
     = public.candidato_match_role(master_candidate.cargo)
   and public.normalize_candidate_identity_name(
     coalesce(duplicate_candidate.nombre_candidato, duplicate_candidate.nombre, '')
   ) = public.normalize_candidate_identity_name(
     coalesce(master_candidate.nombre_candidato, master_candidate.nombre, '')
   )
  where public.normalize_candidate_identity_name(
    coalesce(duplicate_candidate.nombre_candidato, duplicate_candidate.nombre, '')
  ) <> ''
),
unambiguous_duplicates as (
  select duplicate_id
  from pair_candidates
  group by duplicate_id
  having count(*) = 1
)
select
  pair_candidates.duplicate_id,
  pair_candidates.master_id,
  pair_candidates.reason,
  pair_candidates.duplicate_snapshot,
  pair_candidates.master_snapshot,
  pair_candidates.votos_afectados
from pair_candidates
join unambiguous_duplicates
  on unambiguous_duplicates.duplicate_id = pair_candidates.duplicate_id;

insert into public.candidato_unificaciones (
  batch,
  duplicate_id,
  master_id,
  reason,
  duplicate_snapshot,
  master_snapshot,
  votos_afectados
)
select
  '0028_unificar_candidatos_por_identidad',
  merge_map.duplicate_id,
  merge_map.master_id,
  merge_map.reason,
  merge_map.duplicate_snapshot,
  merge_map.master_snapshot,
  merge_map.votos_afectados
from candidato_identity_merge_map_0028 as merge_map
on conflict do nothing;

insert into public.votoseguro_unificacion_backup (
  batch,
  votoseguro_id,
  duplicate_id,
  master_id,
  matched_columns,
  before_snapshot
)
select
  '0028_unificar_candidatos_por_identidad',
  voto.id,
  merge_map.duplicate_id,
  merge_map.master_id,
  array_remove(array[
    case when voto.candidato_id = merge_map.duplicate_id then 'candidato_id' end,
    case when voto.concejal_id = merge_map.duplicate_id then 'concejal_id' end,
    case when voto.intendente_id = merge_map.duplicate_id then 'intendente_id' end
  ], null)::text[],
  to_jsonb(voto)
from public.votoseguro as voto
join candidato_identity_merge_map_0028 as merge_map
  on voto.candidato_id = merge_map.duplicate_id
  or voto.concejal_id = merge_map.duplicate_id
  or voto.intendente_id = merge_map.duplicate_id
on conflict do nothing;

update public.votoseguro as voto
set
  candidato_id = case
    when voto.candidato_id = merge_map.duplicate_id then master_candidate.id
    else voto.candidato_id
  end,
  candidato_nombre = case
    when voto.candidato_id = merge_map.duplicate_id then master_candidate.nombre_candidato
    else voto.candidato_nombre
  end,
  candidato_numero_lista = case
    when voto.candidato_id = merge_map.duplicate_id then master_candidate.numero_lista
    else voto.candidato_numero_lista
  end,
  candidato_cargo = case
    when voto.candidato_id = merge_map.duplicate_id then master_candidate.cargo
    else voto.candidato_cargo
  end,
  candidato_departamento = case
    when voto.candidato_id = merge_map.duplicate_id then master_candidate.departamento
    else voto.candidato_departamento
  end,
  candidato_ciudad = case
    when voto.candidato_id = merge_map.duplicate_id then master_candidate.ciudad
    else voto.candidato_ciudad
  end,
  candidato_localidad = case
    when voto.candidato_id = merge_map.duplicate_id then master_candidate.localidad
    else voto.candidato_localidad
  end,
  candidato_snapshot = case
    when voto.candidato_id = merge_map.duplicate_id then to_jsonb(master_candidate)
    else voto.candidato_snapshot
  end,
  concejal_id = case
    when voto.concejal_id = merge_map.duplicate_id then master_candidate.id
    else voto.concejal_id
  end,
  concejal_nombre = case
    when voto.concejal_id = merge_map.duplicate_id then master_candidate.nombre_candidato
    else voto.concejal_nombre
  end,
  concejal_numero_lista = case
    when voto.concejal_id = merge_map.duplicate_id then master_candidate.numero_lista
    else voto.concejal_numero_lista
  end,
  concejal_cargo = case
    when voto.concejal_id = merge_map.duplicate_id then master_candidate.cargo
    else voto.concejal_cargo
  end,
  concejal_departamento = case
    when voto.concejal_id = merge_map.duplicate_id then master_candidate.departamento
    else voto.concejal_departamento
  end,
  concejal_ciudad = case
    when voto.concejal_id = merge_map.duplicate_id then master_candidate.ciudad
    else voto.concejal_ciudad
  end,
  concejal_localidad = case
    when voto.concejal_id = merge_map.duplicate_id then master_candidate.localidad
    else voto.concejal_localidad
  end,
  concejal_snapshot = case
    when voto.concejal_id = merge_map.duplicate_id then to_jsonb(master_candidate)
    else voto.concejal_snapshot
  end,
  intendente_id = case
    when voto.intendente_id = merge_map.duplicate_id then master_candidate.id
    else voto.intendente_id
  end,
  intendente_nombre = case
    when voto.intendente_id = merge_map.duplicate_id then master_candidate.nombre_candidato
    else voto.intendente_nombre
  end,
  intendente_numero_lista = case
    when voto.intendente_id = merge_map.duplicate_id then master_candidate.numero_lista
    else voto.intendente_numero_lista
  end,
  intendente_cargo = case
    when voto.intendente_id = merge_map.duplicate_id then master_candidate.cargo
    else voto.intendente_cargo
  end,
  intendente_departamento = case
    when voto.intendente_id = merge_map.duplicate_id then master_candidate.departamento
    else voto.intendente_departamento
  end,
  intendente_ciudad = case
    when voto.intendente_id = merge_map.duplicate_id then master_candidate.ciudad
    else voto.intendente_ciudad
  end,
  intendente_localidad = case
    when voto.intendente_id = merge_map.duplicate_id then master_candidate.localidad
    else voto.intendente_localidad
  end,
  intendente_snapshot = case
    when voto.intendente_id = merge_map.duplicate_id then to_jsonb(master_candidate)
    else voto.intendente_snapshot
  end,
  updated_at = now()
from candidato_identity_merge_map_0028 as merge_map
join public.candidatos as master_candidate
  on master_candidate.id = merge_map.master_id
where voto.candidato_id = merge_map.duplicate_id
  or voto.concejal_id = merge_map.duplicate_id
  or voto.intendente_id = merge_map.duplicate_id;

update public.candidatos as duplicate_candidate
set
  activo = false,
  observaciones = concat_ws(
    E'\n',
    nullif(trim(duplicate_candidate.observaciones), ''),
    concat(
      'Desactivado por unificacion automatica 0028. Candidato maestro: ',
      merge_map.master_id::text,
      '. Votos redirigidos: ',
      merge_map.votos_afectados::text,
      '. Motivo: ',
      merge_map.reason,
      '.'
    )
  ),
  updated_at = now()
from candidato_identity_merge_map_0028 as merge_map
where duplicate_candidate.id = merge_map.duplicate_id
  and duplicate_candidate.activo = true;

create or replace function public.prevent_duplicate_active_candidato()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_cedula text;
  normalized_nombre text;
  normalized_identity text;
  normalized_departamento text;
  normalized_ciudad text;
  normalized_lista text;
  normalized_role text;
begin
  normalized_cedula := nullif(regexp_replace(coalesce(new.cedula, ''), '\D', '', 'g'), '');
  new.cedula := normalized_cedula;

  if coalesce(new.activo, true) is not true then
    return new;
  end if;

  if normalized_cedula is not null and exists (
    select 1
    from public.candidatos as candidato
    where candidato.id is distinct from new.id
      and candidato.activo = true
      and candidato.cedula = normalized_cedula
    limit 1
  ) then
    raise exception 'Ya existe un candidato activo con esta cedula.';
  end if;

  normalized_nombre := public.normalize_candidate_match_text(coalesce(new.nombre_candidato, new.nombre, ''));
  normalized_identity := public.normalize_candidate_identity_name(coalesce(new.nombre_candidato, new.nombre, ''));
  normalized_departamento := public.normalize_candidate_match_text(new.departamento);
  normalized_ciudad := public.normalize_candidate_match_text(new.ciudad);
  normalized_lista := coalesce(nullif(trim(new.numero_lista), ''), '-');
  normalized_role := public.candidato_match_role(new.cargo);

  if normalized_nombre = ''
    or normalized_departamento = ''
    or normalized_ciudad = ''
    or normalized_lista = '-'
  then
    return new;
  end if;

  if exists (
    select 1
    from public.candidatos as candidato
    where candidato.id is distinct from new.id
      and candidato.activo = true
      and public.normalize_candidate_match_text(coalesce(candidato.nombre_candidato, candidato.nombre, '')) = normalized_nombre
      and public.normalize_candidate_match_text(candidato.departamento) = normalized_departamento
      and public.normalize_candidate_match_text(candidato.ciudad) = normalized_ciudad
      and coalesce(nullif(trim(candidato.numero_lista), ''), '-') = normalized_lista
      and public.candidato_match_role(candidato.cargo) = normalized_role
    limit 1
  ) then
    raise exception 'Ya existe un candidato activo con el mismo nombre, territorio, lista y cargo.';
  end if;

  if normalized_identity <> '' and exists (
    select 1
    from public.candidatos as candidato
    where candidato.id is distinct from new.id
      and candidato.activo = true
      and public.normalize_candidate_identity_name(coalesce(candidato.nombre_candidato, candidato.nombre, '')) = normalized_identity
      and public.normalize_candidate_match_text(candidato.departamento) = normalized_departamento
      and public.normalize_candidate_match_text(candidato.ciudad) = normalized_ciudad
      and public.candidato_match_role(candidato.cargo) = normalized_role
      and (
        (normalized_cedula is null and candidato.cedula is not null)
        or (normalized_cedula is not null and candidato.cedula is null)
      )
    limit 1
  ) then
    raise exception 'Ya existe un candidato activo para la misma persona, territorio y cargo.';
  end if;

  return new;
end;
$$;

comment on function public.normalize_candidate_identity_name(text) is
  'Normaliza nombres de candidatos para unificacion por identidad, removiendo prefijos como DR o LIC.';

comment on table public.candidato_unificaciones is
  'Auditoria privada de candidatos unificados automaticamente.';

comment on table public.votoseguro_unificacion_backup is
  'Backup privado de campos de Voto Seguro antes de redirigir candidatos duplicados.';

notify pgrst, 'reload schema';
