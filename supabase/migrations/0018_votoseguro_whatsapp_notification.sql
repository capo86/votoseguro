alter table public.votoseguro
  add column if not exists fue_notificado boolean not null default false,
  add column if not exists user_notifico uuid references auth.users(id) on delete set null,
  add column if not exists fecha_notificacion timestamptz,
  add column if not exists fecha_renotificacion timestamptz;

create index if not exists votoseguro_fue_notificado_idx
  on public.votoseguro (fue_notificado);

create index if not exists votoseguro_fecha_notificacion_idx
  on public.votoseguro (fecha_notificacion desc);

create index if not exists votoseguro_user_notifico_idx
  on public.votoseguro (user_notifico);

comment on column public.votoseguro.fue_notificado is
  'Indica si el votante fue notificado por WhatsApp desde Voto Seguro.';

comment on column public.votoseguro.user_notifico is
  'Usuario Auth que registro la ultima notificacion o renotificacion por WhatsApp.';

comment on column public.votoseguro.fecha_notificacion is
  'Fecha de la primera notificacion por WhatsApp.';

comment on column public.votoseguro.fecha_renotificacion is
  'Fecha de la ultima renotificacion por WhatsApp.';

notify pgrst, 'reload schema';
