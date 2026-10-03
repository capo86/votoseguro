create or replace function public.listar_candidatos_activos_para_flyers(
  p_departamento text,
  p_distrito text
)
returns table (
  id uuid,
  cedula text,
  nombre_candidato text,
  cargo text,
  numero_lista text,
  numero_orden text,
  localidad text,
  departamento text,
  ciudad text,
  tipo_codigo text,
  tipo_nombre text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    candidato.id,
    candidato.cedula,
    coalesce(
      nullif(trim(candidato.nombre_candidato), ''),
      nullif(trim(candidato.nombre), ''),
      ''
    ) as nombre_candidato,
    candidato.cargo,
    candidato.numero_lista,
    candidato.numero_orden,
    candidato.localidad,
    candidato.departamento,
    candidato.ciudad,
    coalesce(nullif(candidato.tipo->>'codigo', ''), 'PPC') as tipo_codigo,
    coalesce(
      nullif(candidato.tipo->>'nombre', ''),
      case
        when candidato.tipo->>'codigo' = 'ALIANZA' then 'Alianza'
        else 'PPC'
      end
    ) as tipo_nombre
  from public.candidatos as candidato
  where candidato.activo = true
    and public.normalize_candidate_match_text(candidato.departamento) =
      public.normalize_candidate_match_text(p_departamento)
    and public.normalize_candidate_match_text(candidato.ciudad) =
      public.normalize_candidate_match_text(p_distrito)
  order by
    public.candidato_match_role(candidato.cargo),
    candidato.numero_lista,
    candidato.numero_orden,
    coalesce(
      nullif(trim(candidato.nombre_candidato), ''),
      nullif(trim(candidato.nombre), ''),
      ''
    );
$$;

revoke all on function public.listar_candidatos_activos_para_flyers(text, text) from public;
grant execute on function public.listar_candidatos_activos_para_flyers(text, text) to authenticated;
grant execute on function public.listar_candidatos_activos_para_flyers(text, text) to service_role;

comment on function public.listar_candidatos_activos_para_flyers(text, text) is
  'Devuelve candidatos activos de un territorio para elegir flyers en Consulta Padron, sin depender del alcance distrital del usuario logueado.';

notify pgrst, 'reload schema';
