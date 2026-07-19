alter table public.candidatos
  add column if not exists nombre_candidato text;

update public.candidatos
set nombre_candidato = coalesce(nullif(trim(nombre_candidato), ''), nombre)
where nombre_candidato is null
  or trim(nombre_candidato) = '';

alter table public.candidatos
  alter column nombre_candidato set not null;

create index if not exists candidatos_localidad_numero_lista_idx
  on public.candidatos (localidad, numero_lista);

comment on column public.candidatos.nombre_candidato is
  'Nombre principal del candidato. Es el dato preponderante para mostrar y seleccionar.';

comment on column public.candidatos.numero_lista is
  'Numero de lista usado como dato secundario para identificar al candidato por localidad.';
