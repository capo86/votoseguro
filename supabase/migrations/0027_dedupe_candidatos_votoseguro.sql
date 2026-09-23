-- Unifica candidatos duplicados luego de incorporar cedula/padron.
-- Los votos conservan sus snapshots historicos; solo se redirigen los ids al candidato maestro.

create or replace function public.normalize_candidate_match_text(p_value text)
returns text
language sql
immutable
parallel safe
as $$
  select btrim(
    regexp_replace(
      regexp_replace(
        translate(
          upper(coalesce(p_value, '')),
          U&'\00C1\00C0\00C2\00C3\00C4\00C9\00C8\00CA\00CB\00CD\00CC\00CE\00CF\00D3\00D2\00D4\00D5\00D6\00DA\00D9\00DB\00DC\00D1\00C7',
          'AAAAAEEEEIIIIOOOOOUUUUNC'
        ),
        '[^A-Z0-9]+',
        ' ',
        'g'
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.candidato_match_role(p_cargo text)
returns text
language sql
immutable
parallel safe
as $$
  select case
    when public.normalize_candidate_match_text(p_cargo) like '%INTENDENTE%' then 'INTENDENTE'
    else 'CONCEJAL'
  end;
$$;

update public.candidatos
set
  activo = coalesce(activo, true),
  cedula = nullif(regexp_replace(coalesce(cedula, ''), '\D', '', 'g'), '')
where activo is null
  or cedula is not null;

create temporary table candidato_merge_map_0027 on commit drop as
with candidate_base as (
  select
    candidato.id,
    candidato.activo,
    candidato.created_at,
    candidato.updated_at,
    nullif(regexp_replace(coalesce(candidato.cedula, ''), '\D', '', 'g'), '') as cedula_key,
    public.normalize_candidate_match_text(coalesce(candidato.nombre_candidato, candidato.nombre, '')) as nombre_key,
    public.normalize_candidate_match_text(candidato.departamento) as departamento_key,
    public.normalize_candidate_match_text(candidato.ciudad) as ciudad_key,
    public.candidato_match_role(candidato.cargo) as role_key,
    coalesce(nullif(trim(candidato.numero_lista), ''), '-') as lista_key,
    (
      candidato.padron_ogc_fid is not null
      or coalesce(candidato.padron_snapshot <> '{}'::jsonb, false)
    ) as has_padron
  from public.candidatos as candidato
),
ranked_by_cedula as (
  select
    candidate_base.*,
    first_value(id) over (
      partition by cedula_key
      order by activo desc, has_padron desc, updated_at desc nulls last, created_at desc nulls last, id
    ) as master_id
  from candidate_base
  where cedula_key is not null
),
map_by_cedula as (
  select
    id as duplicate_id,
    master_id,
    1 as priority,
    'cedula'::text as reason
  from ranked_by_cedula
  where id <> master_id
),
ranked_by_person as (
  select
    candidate_base.*,
    first_value(id) over (
      partition by departamento_key, ciudad_key, role_key, lista_key, nombre_key
      order by
        (cedula_key is not null) desc,
        has_padron desc,
        activo desc,
        updated_at desc nulls last,
        created_at desc nulls last,
        id
    ) as master_id,
    first_value(cedula_key) over (
      partition by departamento_key, ciudad_key, role_key, lista_key, nombre_key
      order by
        (cedula_key is not null) desc,
        has_padron desc,
        activo desc,
        updated_at desc nulls last,
        created_at desc nulls last,
        id
    ) as master_cedula_key,
    max((cedula_key is not null or has_padron)::integer) over (
      partition by departamento_key, ciudad_key, role_key, lista_key, nombre_key
    ) as has_structured_master
  from candidate_base
  where nombre_key <> ''
    and departamento_key <> ''
    and ciudad_key <> ''
    and lista_key <> '-'
),
map_by_person as (
  select
    id as duplicate_id,
    master_id,
    2 as priority,
    'persona_territorio_lista'::text as reason
  from ranked_by_person
  where id <> master_id
    and has_structured_master = 1
    and cedula_key is null
    and master_cedula_key is not null
),
raw_map as (
  select * from map_by_cedula
  union all
  select * from map_by_person
),
deduped_map as (
  select distinct on (duplicate_id)
    duplicate_id,
    master_id,
    priority,
    reason
  from raw_map
  where duplicate_id <> master_id
  order by duplicate_id, priority
)
select
  deduped_map.duplicate_id,
  coalesce(master_redirect.master_id, deduped_map.master_id) as master_id,
  deduped_map.reason
from deduped_map
left join deduped_map as master_redirect
  on master_redirect.duplicate_id = deduped_map.master_id
where deduped_map.duplicate_id <> coalesce(master_redirect.master_id, deduped_map.master_id);

update public.votoseguro as voto
set candidato_id = merge_map.master_id
from candidato_merge_map_0027 as merge_map
where voto.candidato_id = merge_map.duplicate_id;

update public.votoseguro as voto
set concejal_id = merge_map.master_id
from candidato_merge_map_0027 as merge_map
where voto.concejal_id = merge_map.duplicate_id;

update public.votoseguro as voto
set intendente_id = merge_map.master_id
from candidato_merge_map_0027 as merge_map
where voto.intendente_id = merge_map.duplicate_id;

update public.candidatos as candidato
set
  activo = false,
  observaciones = concat_ws(
    E'\n',
    nullif(trim(candidato.observaciones), ''),
    concat('Desactivado por unificacion automatica 0027. Candidato maestro: ', merge_map.master_id::text, '. Motivo: ', merge_map.reason, '.')
  ),
  updated_at = now()
from candidato_merge_map_0027 as merge_map
where candidato.id = merge_map.duplicate_id
  and candidato.activo = true;

create unique index if not exists candidatos_cedula_activo_uidx
  on public.candidatos (cedula)
  where activo = true
    and cedula is not null;

create or replace function public.prevent_duplicate_active_candidato()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_cedula text;
  normalized_nombre text;
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

  return new;
end;
$$;

drop trigger if exists trg_prevent_duplicate_active_candidato on public.candidatos;
create trigger trg_prevent_duplicate_active_candidato
before insert or update of activo, cedula, nombre, nombre_candidato, cargo, numero_lista, departamento, ciudad
on public.candidatos
for each row
execute function public.prevent_duplicate_active_candidato();

comment on function public.normalize_candidate_match_text(text) is
  'Normaliza texto para empatar candidatos historicos con candidatos importados desde padron.';

comment on function public.candidato_match_role(text) is
  'Reduce el cargo electoral a INTENDENTE o CONCEJAL para detectar duplicados operativos.';

comment on function public.prevent_duplicate_active_candidato() is
  'Evita nuevos candidatos activos duplicados por cedula o por nombre/territorio/lista/cargo.';

notify pgrst, 'reload schema';
