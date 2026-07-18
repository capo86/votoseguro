# AGENTS.md — VotoSeguro

Guía de referencia para cualquier agente de IA (o humano) que trabaje en este repositorio. Léela completa antes de tocar código.

## 1. Qué es este proyecto

**VotoSeguro** es una aplicación web para:
1. Consultar el **padrón electoral** de una persona por número de **cédula** (nombre, departamento, distrito, zona y local de votación).
2. Permitir que esa persona registre su **ubicación** (mapa OpenStreetMap), su **teléfono** y su **candidato de preferencia**.
3. Guardar todo en **Supabase** para su posterior gestión (fiscalización de votos, logística el día de la elección, contacto telefónico, etc).

El formulario de referencia (ver captura compartida) tiene esta forma:

```
👤 NOMBRE Y APELLIDO      [ editable, se completa solo o manual ]
🔒 DEPARTAMENTO           [ bloqueado, viene de la consulta de cédula ]
🔒 DISTRITO               [ bloqueado, viene de la consulta de cédula ]
🔒 ZONA                   [ bloqueado, viene de la consulta de cédula ]
🔒 LOCAL                  [ bloqueado, viene de la consulta de cédula ]
```

A eso se le suman los campos nuevos: teléfono, ubicación (mapa) y candidato.

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Build tool | **Vite** | modo `react-ts` |
| UI | **React 18** (estable, sin RC/canary) | function components + hooks |
| Lenguaje | **TypeScript** (estable) | `strict: true` en `tsconfig.json` |
| Estilos | **Tailwind CSS** (estable, v3.x) | sin plugins experimentales |
| Iconos | **lucide-react** | usar iconos Lucide para acciones, estados y ayudas visuales |
| Backend / DB | **Supabase** | Postgres + Auth + Storage si hace falta |
| Mapas | **OpenStreetMap** vía `react-leaflet` + `leaflet` | no usar Google Maps (requiere billing) |
| Deploy | **Vercel** | build command `vite build`, output `dist` |
| Consulta de padrón | API externa de cédula → padrón (TSJE u homólogo) | ver sección 6 |

No introducir Next.js, Redux, ni CSS-in-JS: el proyecto se mantiene simple (Vite SPA + Tailwind).

## 3. Estructura de carpetas

```
votoseguro/
├─ src/
│  ├─ components/
│  │  ├─ form/
│  │  │  ├─ CedulaLookupField.tsx     # input de cédula + botón "buscar"
│  │  │  ├─ PadronReadonlyFields.tsx  # departamento/distrito/zona/local
│  │  │  ├─ PhoneField.tsx
│  │  │  ├─ CandidatoSelect.tsx
│  │  │  └─ LocationPickerMap.tsx     # mapa Leaflet + OSM
│  │  └─ ui/                          # botones, inputs, cards reutilizables
│  ├─ lib/
│  │  ├─ supabaseClient.ts
│  │  └─ padronApi.ts                 # wrapper del fetch a la API de cédula
│  ├─ types/
│  │  ├─ votante.ts
│  │  └─ candidato.ts
│  ├─ hooks/
│  │  └─ usePadronLookup.ts
│  ├─ pages/ (o routes/ si se agrega router)
│  │  └─ RegistroVotantePage.tsx
│  ├─ App.tsx
│  └─ main.tsx
├─ supabase/
│  └─ migrations/                     # SQL versionado, ver sección 5
├─ .env.example
├─ tailwind.config.ts
├─ vite.config.ts
├─ tsconfig.json
└─ AGENTS.md
```

## 4. Convenciones de código

- **Componentes**: un componente por archivo, nombre en PascalCase, export default al final.
- **Tipado**: nada de `any`. Definir interfaces en `src/types/` y reusarlas (`Votante`, `Candidato`, `PadronResponse`).
- **Formularios**: usar `react-hook-form` + `zod` para validación (cédula numérica, teléfono con formato PY `09XXXXXXXX`).
- **Estilos Tailwind**: seguir la paleta de la captura — fondo oscuro `bg-neutral-800`, acento naranja del logo PPC `#F2820C`/`orange-500`, inputs blancos con borde izquierdo naranja (`border-l-4 border-orange-500`).
- **Iconografía**: usar `lucide-react` como librería estándar de iconos. Preferir iconos Lucide en botones, estados, inputs con ayuda visual y acciones del formulario antes que SVGs manuales.
- **Fetch a Supabase**: siempre a través de `src/lib/supabaseClient.ts`, nunca instanciar el cliente en un componente.
- **Nombres de tabla/columnas**: `snake_case` en Supabase, mapear a `camelCase` en TypeScript en la capa `types/`.
- **Commits**: convencional (`feat:`, `fix:`, `chore:`), en español, mensajes cortos.

## 5. Esquema de datos en Supabase

### Tabla `candidatos`

```sql
create table public.candidatos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cargo text,                 -- ej. "Intendente", "Concejal", "Diputado"
  foto_url text,
  activo boolean default true,
  created_at timestamptz default now()
);
```

### Tabla `votantes`

```sql
create table public.votantes (
  id uuid primary key default gen_random_uuid(),
  cedula text not null unique,
  nombre_apellido text not null,
  departamento text,
  distrito text,
  zona text,
  local text,
  telefono text,
  ubicacion_lat double precision,
  ubicacion_lng double precision,
  candidato_id uuid references public.candidatos(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index votantes_cedula_idx on public.votantes (cedula);
create index votantes_candidato_idx on public.votantes (candidato_id);
```

- Habilitar **Row Level Security (RLS)** en ambas tablas desde el día 1.
- Política mínima para empezar: `insert` público restringido por rate-limit (o vía función Edge), `select`/`update`/`delete` solo para roles autenticados (equipo de campaña).
- Guardar cada migración nueva en `supabase/migrations/NNNN_descripcion.sql`.

## 6. Consulta de padrón por cédula

- Crear `src/lib/padronApi.ts` con una función `buscarPorCedula(cedula: string): Promise<PadronResponse>`.
- Idealmente esta llamada **no** se hace directo desde el cliente si la API externa no tiene CORS habilitado o requiere una key: usar una **Supabase Edge Function** como proxy (`supabase/functions/padron-lookup/index.ts`) que reciba la cédula, llame a la API real del lado del servidor, y devuelva el JSON limpio al frontend.
- Definir el tipo de respuesta esperado:

```ts
export interface PadronResponse {
  cedula: string;
  nombreApellido: string;
  departamento: string;
  distrito: string;
  zona: string;
  local: string;
}
```

- Manejar estados: `idle | loading | found | not_found | error` en el hook `usePadronLookup`.
- Los campos departamento/distrito/zona/local se muestran **bloqueados** (readonly) tal como en la captura, una vez llega la respuesta.

## 7. Ubicación con OpenStreetMap

- Librería: `leaflet` + `react-leaflet` (no requieren API key).
- Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` respetando la política de uso de OSM (agregar atribución visible en el mapa).
- Guardar solo `lat`/`lng` en la tabla `votantes`.
- Ofrecer botón "usar mi ubicación actual" con `navigator.geolocation.getCurrentPosition`, y permitir mover un marcador manualmente como respaldo.

## 8. Variables de entorno

`.env.example`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PADRON_API_URL=
```

Nunca commitear `.env`. Las keys sensibles de la API del padrón (si las hay) van solo en la Edge Function de Supabase, no en variables `VITE_*` (esas quedan expuestas en el bundle del cliente).

## 9. Deploy en Vercel

- Framework preset: **Vite**.
- Build command: `npm run build`.
- Output directory: `dist`.
- Configurar las mismas variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en el dashboard de Vercel.
- Cada PR a `main` genera un preview deploy; mergear a `main` despliega a producción.

## 10. Roadmap (fases)

1. **Fase 1 (actual)** — Replicar el formulario visual: nombre, departamento/distrito/zona/local (mock o estático).
2. **Fase 2** — Conectar la consulta real por cédula (Edge Function + `padronApi.ts`).
3. **Fase 3** — Agregar mapa OSM para ubicación + campo de teléfono.
4. **Fase 4** — Agregar selección de candidato, conectar todo a Supabase (insert/upsert por cédula), panel simple de administración/listado.
5. **Fase 5** — RLS afinado, autenticación del equipo de campaña, exportación de datos (CSV).

## 11. Checklist antes de abrir un PR

- [ ] `npm run build` sin errores de TypeScript.
- [ ] Tailwind sin clases arbitrarias innecesarias; reusar tokens del `tailwind.config.ts`.
- [ ] Ninguna key sensible hardcodeada.
- [ ] Migraciones SQL agregadas si se tocó el esquema.
- [ ] Formulario probado con cédula válida e inválida (estados `loading`/`not_found`/`error`).
