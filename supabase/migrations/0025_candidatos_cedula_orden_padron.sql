alter table public.candidatos
  add column if not exists cedula text,
  add column if not exists numero_orden text,
  add column if not exists padron_ogc_fid integer,
  add column if not exists padron_snapshot jsonb not null default '{}'::jsonb;

update public.candidatos
set cedula = nullif(regexp_replace(cedula, '\D', '', 'g'), '')
where cedula is not null;

alter table public.candidatos
  drop constraint if exists candidatos_cedula_digits_chk;

alter table public.candidatos
  add constraint candidatos_cedula_digits_chk
  check (cedula is null or cedula ~ '^[0-9]+$');

create index if not exists candidatos_cedula_idx
  on public.candidatos (cedula)
  where cedula is not null;

create index if not exists candidatos_territorio_lista_orden_idx
  on public.candidatos (departamento, ciudad, numero_lista, numero_orden);

comment on column public.candidatos.cedula is
  'Cedula de identidad del candidato. Se usa para cruzar con el padron y evitar depender solo del nombre.';

comment on column public.candidatos.numero_orden is
  'Numero de orden/opcion del candidato en la lista electoral.';

comment on column public.candidatos.padron_ogc_fid is
  'Identificador tecnico de la fila del padron consultada para completar datos del candidato.';

comment on column public.candidatos.padron_snapshot is
  'Snapshot del padron usado al completar el candidato desde cedula.';

notify pgrst, 'reload schema';
