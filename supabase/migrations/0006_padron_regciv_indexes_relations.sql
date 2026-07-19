set statement_timeout = 0;

create index if not exists staging_regciv_cedula_idx
  on public.staging_regciv (cedula);

create index if not exists staging_regciv_territorio_idx
  on public.staging_regciv (depart, distrito, zona, local);

create index if not exists staging_regciv_nacionalidad_idx
  on public.staging_regciv (id_nacion);

create index if not exists staging_regciv_indigena_idx
  on public.staging_regciv (cod_pueblo, cod_comuni);

create index if not exists staging_regciv_discapacidad_idx
  on public.staging_regciv (cod_discap);

create unique index if not exists staging_dep_depart_uidx
  on public.staging_dep (depart);

create unique index if not exists staging_dis_depart_distrito_uidx
  on public.staging_dis (depart, distrito);

create unique index if not exists staging_zon_depart_distrito_zona_uidx
  on public.staging_zon (depart, distrito, zona);

create unique index if not exists staging_loc_dpto_distrito_zona_local_uidx
  on public.staging_loc (dpto, distrito, zona, local);

create unique index if not exists staging_nacionalidades_id_nacion_uidx
  on public.staging_nacionalidades (id_nacion);

create unique index if not exists staging_pueblo_indigena_cod_pueblo_uidx
  on public.staging_pueblo_indigena (cod_pueblo);

create unique index if not exists staging_comunidad_indigena_cod_pueblo_cod_comuni_uidx
  on public.staging_comunidad_indigena (cod_pueblo, cod_comuni);

create unique index if not exists staging_discapacidad_cod_discap_uidx
  on public.staging_discapacidad (cod_discap);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'staging_regciv_depart_fk'
  ) then
    alter table public.staging_regciv
      add constraint staging_regciv_depart_fk
      foreign key (depart)
      references public.staging_dep (depart)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'staging_regciv_distrito_fk'
  ) then
    alter table public.staging_regciv
      add constraint staging_regciv_distrito_fk
      foreign key (depart, distrito)
      references public.staging_dis (depart, distrito)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'staging_regciv_zona_fk'
  ) then
    alter table public.staging_regciv
      add constraint staging_regciv_zona_fk
      foreign key (depart, distrito, zona)
      references public.staging_zon (depart, distrito, zona)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'staging_regciv_local_fk'
  ) then
    alter table public.staging_regciv
      add constraint staging_regciv_local_fk
      foreign key (depart, distrito, zona, local)
      references public.staging_loc (dpto, distrito, zona, local)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'staging_regciv_nacionalidad_fk'
  ) then
    alter table public.staging_regciv
      add constraint staging_regciv_nacionalidad_fk
      foreign key (id_nacion)
      references public.staging_nacionalidades (id_nacion)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'staging_regciv_pueblo_indigena_fk'
  ) then
    alter table public.staging_regciv
      add constraint staging_regciv_pueblo_indigena_fk
      foreign key (cod_pueblo)
      references public.staging_pueblo_indigena (cod_pueblo)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'staging_regciv_comunidad_indigena_fk'
  ) then
    alter table public.staging_regciv
      add constraint staging_regciv_comunidad_indigena_fk
      foreign key (cod_pueblo, cod_comuni)
      references public.staging_comunidad_indigena (cod_pueblo, cod_comuni)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'staging_regciv_discapacidad_fk'
  ) then
    alter table public.staging_regciv
      add constraint staging_regciv_discapacidad_fk
      foreign key (cod_discap)
      references public.staging_discapacidad (cod_discap)
      not valid;
  end if;
end;
$$;

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
  tipo text,
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
    nullif(trim(r.tipo::text), '') as tipo,
    r.id_nacion,
    nac.des_nacion::text as nacionalidad,
    nullif(trim(r.es_indigen::text), '') as es_indigena,
    pueblo.descrip::text as pueblo_indigena,
    comunidad.descrip::text as comunidad_indigena,
    nullif(trim(r.tiene_disc::text), '') as tiene_discapacidad,
    discapacidad.descrip::text as discapacidad
  from public.staging_regciv as r
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

revoke all on function public.buscar_padron_por_cedula(numeric) from public;
grant execute on function public.buscar_padron_por_cedula(numeric) to authenticated;
grant execute on function public.buscar_padron_por_cedula(numeric) to service_role;

analyze public.staging_regciv;
analyze public.staging_dep;
analyze public.staging_dis;
analyze public.staging_zon;
analyze public.staging_loc;
analyze public.staging_nacionalidades;
analyze public.staging_pueblo_indigena;
analyze public.staging_comunidad_indigena;
analyze public.staging_discapacidad;
