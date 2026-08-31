create or replace function public.buscar_padron_por_cedula(p_cedula numeric)
returns table (
  ogc_fid integer,
  cedula numeric,
  nombre text,
  apellido text,
  nombre_apellido text,
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
  mesa integer,
  orden integer,
  tipo text,
  tipo_voto integer,
  id_nacion numeric,
  nacionalidad text,
  es_indigena text,
  pueblo_indigena text,
  comunidad_indigena text,
  tiene_discapacidad text,
  discapacidad text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.ogc_fid,
    r.cedula,
    nullif(trim(r.nombre::text), '') as nombre,
    nullif(trim(r.apellido::text), '') as apellido,
    nullif(trim(concat_ws(' ', nullif(r.nombre::text, ''), nullif(r.apellido::text, ''))), '') as nombre_apellido,
    nullif(trim(r.sexo::text), '') as sexo,
    r.fec_nac as fecha_nacimiento,
    r.fec_inscri as fecha_inscripcion,
    r.depart,
    dep.descrip::text as departamento,
    r.distrito,
    dis.descrip::text as distrito_descripcion,
    r.zona,
    zon.descrip::text as zona_descripcion,
    r.local,
    loc.descrip::text as local_descripcion,
    coalesce(actualizado.mesa::integer, r.mesa) as mesa,
    coalesce(actualizado.orden::integer, r.orden) as orden,
    nullif(trim(r.tipo::text), '') as tipo,
    coalesce(actualizado.tipo_voto::integer, r.tipo_voto) as tipo_voto,
    r.id_nacion,
    nac.des_nacion::text as nacionalidad,
    nullif(trim(r.es_indigen::text), '') as es_indigena,
    pueblo.descrip::text as pueblo_indigena,
    comunidad.descrip::text as comunidad_indigena,
    nullif(trim(r.tiene_disc::text), '') as tiene_discapacidad,
    discapacidad.descrip::text as discapacidad
  from public.staging_regciv as r
  left join lateral (
    select mesa, orden, tipo_voto
    from public.staging_regciv_2026_source
    where cedula = r.cedula
    order by ogc_fid
    limit 1
  ) as actualizado on true
  left join public.staging_dep as dep
    on dep.depart = r.depart
  left join public.staging_dis as dis
    on dis.depart = r.depart
   and dis.distrito = r.distrito
  left join public.staging_zon as zon
    on zon.depart = r.depart
   and zon.distrito = r.distrito
   and zon.zona = r.zona
  left join public.staging_loc as loc
    on loc.dpto = r.depart
   and loc.distrito = r.distrito
   and loc.zona = r.zona
   and loc.local = r.local
  left join public.staging_nacionalidades as nac
    on nac.id_nacion = r.id_nacion
  left join public.staging_pueblo_indigena as pueblo
    on pueblo.cod_pueblo = r.cod_pueblo
  left join public.staging_comunidad_indigena as comunidad
    on comunidad.cod_pueblo = r.cod_pueblo
   and comunidad.cod_comuni = r.cod_comuni
  left join public.staging_discapacidad as discapacidad
    on discapacidad.cod_discap = r.cod_discap
  where r.cedula = p_cedula
  order by r.ogc_fid;
$$;

notify pgrst, 'reload schema';
