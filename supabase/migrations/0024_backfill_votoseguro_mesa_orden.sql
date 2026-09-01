update public.votoseguro as voto
set
  mesa = coalesce(voto.mesa, fuente.mesa::text),
  orden = coalesce(voto.orden, fuente.orden::text),
  updated_at = now()
from public.staging_regciv_2026_source as fuente
where fuente.cedula = nullif(regexp_replace(voto.cedula, '\D', '', 'g'), '')::numeric
  and (voto.mesa is null or voto.orden is null)
  and (fuente.mesa is not null or fuente.orden is not null);
