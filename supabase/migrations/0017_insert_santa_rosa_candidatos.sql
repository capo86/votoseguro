with nuevos_candidatos (
  nombre_candidato,
  departamento,
  ciudad,
  numero_lista,
  cargo,
  observaciones
) as (
  values
    (
      'DIONISIO RIVERO OCAMPO',
      'SAN PEDRO',
      'SANTA ROSA DEL AGUARAY',
      '3',
      'TITULAR',
      'Organizacion politica: ALIANZA GOBERNEMOS JUNTOS SANTA ROSA; Opcion: 10; Color: VERDE'
    ),
    (
      'HERNAN JAVIER ALVARENGA AGUILERA',
      'SAN PEDRO',
      'SANTA ROSA DEL AGUARAY',
      '3',
      'TITULAR',
      'Organizacion politica: ALIANZA GOBERNEMOS JUNTOS SANTA ROSA; Opcion: 11; Color: VERDE'
    )
)
insert into public.candidatos (
  nombre,
  nombre_candidato,
  tipo,
  cargo,
  numero_lista,
  localidad,
  departamento,
  ciudad,
  observaciones,
  activo,
  created_by_user
)
select
  nuevo.nombre_candidato,
  nuevo.nombre_candidato,
  '{"codigo":"ALIANZA","nombre":"Alianza"}'::jsonb,
  nuevo.cargo,
  nuevo.numero_lista,
  null,
  nuevo.departamento,
  nuevo.ciudad,
  nuevo.observaciones,
  true,
  'Migracion 0017'
from nuevos_candidatos as nuevo
where not exists (
  select 1
  from public.candidatos as candidato
  where upper(trim(candidato.nombre_candidato)) = upper(trim(nuevo.nombre_candidato))
    and upper(trim(coalesce(candidato.departamento, ''))) = upper(trim(nuevo.departamento))
    and upper(trim(coalesce(candidato.ciudad, ''))) = upper(trim(nuevo.ciudad))
    and trim(coalesce(candidato.numero_lista, '')) = trim(nuevo.numero_lista)
    and upper(trim(coalesce(candidato.cargo, ''))) = upper(trim(nuevo.cargo))
);
