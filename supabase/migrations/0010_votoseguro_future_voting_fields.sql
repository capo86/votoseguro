alter table public.votoseguro
  add column if not exists local_votacion text,
  add column if not exists mesa text,
  add column if not exists orden text;

create index if not exists votoseguro_local_votacion_idx
  on public.votoseguro (local_votacion);

create index if not exists votoseguro_mesa_idx
  on public.votoseguro (mesa);

comment on column public.votoseguro.local_votacion is
  'Local de votacion del snapshot. Se completara desde la fuente de padron cuando este disponible.';

comment on column public.votoseguro.mesa is
  'Mesa de votacion. Campo preparado para integracion futura.';

comment on column public.votoseguro.orden is
  'Orden en mesa. Campo preparado para integracion futura.';
