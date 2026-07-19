select 'staging_boletas_deshabilitadas' as table_name, count(*)::bigint as total from public.staging_boletas_deshabilitadas union all
select 'staging_ciudades', count(*)::bigint from public.staging_ciudades union all
select 'staging_comunidad_indigena', count(*)::bigint from public.staging_comunidad_indigena union all
select 'staging_dep', count(*)::bigint from public.staging_dep union all
select 'staging_desafiliaciones', count(*)::bigint from public.staging_desafiliaciones union all
select 'staging_desh_exte', count(*)::bigint from public.staging_desh_exte union all
select 'staging_dis', count(*)::bigint from public.staging_dis union all
select 'staging_discapacidad', count(*)::bigint from public.staging_discapacidad union all
select 'staging_dobles', count(*)::bigint from public.staging_dobles union all
select 'staging_inhabilitados', count(*)::bigint from public.staging_inhabilitados union all
select 'staging_loc', count(*)::bigint from public.staging_loc union all
select 'staging_nacionalidades', count(*)::bigint from public.staging_nacionalidades union all
select 'staging_part', count(*)::bigint from public.staging_part union all
select 'staging_pueblo_indigena', count(*)::bigint from public.staging_pueblo_indigena union all
select 'staging_regciv', count(*)::bigint from public.staging_regciv union all
select 'staging_regciv_exte', count(*)::bigint from public.staging_regciv_exte union all
select 'staging_tgen', count(*)::bigint from public.staging_tgen union all
select 'staging_tipoins', count(*)::bigint from public.staging_tipoins union all
select 'staging_tiporeg', count(*)::bigint from public.staging_tiporeg union all
select 'staging_zon', count(*)::bigint from public.staging_zon
order by table_name;
