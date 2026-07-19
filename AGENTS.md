# AGENTS.md - VotoSeguro

Guia de referencia para cualquier agente de IA o humano que trabaje en este repositorio.
Leerla completa antes de tocar codigo.

## 1. Contexto del proyecto

**VotoSeguro** es una aplicacion web para trabajo territorial electoral.

Contextos principales:

- **Candidatos**: ABM de candidatos. El dato principal es `nombre_candidato`; `numero_lista`, `localidad`, `departamento` y `ciudad` son datos secundarios de identificacion territorial.
- **Voto Seguro**: carga operativa del votante. Desde aca se consulta o completa la informacion del padron, telefono, ubicacion y candidato asociado.
- **Padron**: contexto de migracion/importacion. Queda reservado para tablas fuente DBF del padron de Paraguay y futuras tablas normalizadas de departamentos, ciudades, zonas y locales.
- **Usuarios**: administracion operativa del equipo. El usuario ingresa con cedula + contraseña; Auth usa un email tecnico oculto generado desde la cedula.

No tratar "lista" como entidad principal. La lista ayuda a identificar al candidato por localidad, pero la UI y el modelo deben dar preponderancia al candidato.

## 2. Stack tecnologico

| Capa | Tecnologia | Notas |
|---|---|---|
| Build tool | Vite | modo `react-ts` |
| UI | React 18 | function components + hooks |
| Estado | Zustand | estado global liviano: auth, tema, navegacion |
| Lenguaje | TypeScript | `strict: true` |
| Estilos | Tailwind CSS v3 | mobile first, claro/oscuro |
| Iconos | lucide-react | usar Lucide para acciones, estados, inputs y menu |
| Backend | Supabase | Postgres + Auth + Storage |
| Mapas | OpenStreetMap | via Leaflet/react-leaflet |
| PWA | vite-plugin-pwa + Workbox | app online-first, instalable Android/iOS |
| Deploy | Vercel | build `npm run build`, output `dist` |

No introducir Next.js, Redux ni CSS-in-JS sin una razon fuerte y aprobada.

## 3. Identidad visual

- Usar el naranja del logo PPC como acento principal: `brand-orange` / `#F2820C`.
- Mantener la UI mobile first.
- Usar `lucide-react` para iconos de botones, menu, estados y campos.
- No crear SVGs manuales para iconos si Lucide ya tiene uno equivalente.
- Mantener alto contraste, foco visible y controles tactiles comodos.
- El item administrativo de metricas debe mostrarse como **Resumen**, no como "Dashboard" ni "Panel" en textos visibles.
- Footer visible: `Creado por Cleto Perez y Juan Bellenzier`.
- SEO/Open Graph usa canonical `https://votoseguro-two.vercel.app/`, logo PPC y color naranja.
- Open Graph principal: `public/og-votoseguro-ppc.png`.

## 3.1 PWA

- La app es PWA online-first: se instala y cachea interfaz/assets, pero las operaciones de Supabase requieren conexion.
- No implementar carga offline ni sincronizacion local sin plan aprobado; puede crear conflictos de Voto Seguro.
- Service worker registrado desde `src/main.tsx` con `virtual:pwa-register` y `autoUpdate`.
- Configuracion PWA central en `vite.config.ts` usando `VitePWA`.
- No cachear respuestas de Supabase/Auth/API ni datos sensibles en Workbox.
- Iconos PWA generados desde `logo ppc oficial.png` con `npm run pwa:assets`.
- Assets PWA en `public/pwa/`:
  - favicons `16x16` y `32x32`
  - Apple touch icons `152x152`, `167x167`, `180x180`
  - Android icons `192x192`, `512x512`
  - maskable icons `192x192`, `512x512`
  - `splash-logo.png`
- Si se cambia el logo oficial, regenerar assets con `npm run pwa:assets`, ejecutar build y verificar manifest.

## 4. Estructura de carpetas

```txt
src/
  components/
    auth/
    form/
    layout/
    ui/
  hooks/
  lib/
  pages/
  store/
  types/
public/
  pwa/
supabase/
  migrations/
```

## 5. Convenciones de codigo

- Componentes en PascalCase, un componente por archivo cuando sea razonable.
- Tipos compartidos en `src/types/`.
- Acceso a Supabase solo desde `src/lib/`; no instanciar clientes en componentes.
- Formularios con `react-hook-form` + `zod` cuando haya validacion.
- Supabase usa `snake_case`; TypeScript usa `camelCase`.
- No hardcodear secretos. Las variables `VITE_*` quedan expuestas en el bundle.

## 6. Esquema Supabase

### Tabla `candidatos`

La columna principal de nombre es `nombre_candidato`.

```sql
create table public.candidatos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, -- compatibilidad temporal
  nombre_candidato text not null,
  cargo text,
  numero_lista text,
  localidad text,
  departamento text,
  ciudad text,
  foto_url text,
  observaciones text,
  activo boolean default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_by_user text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

`nombre` se mantiene por compatibilidad con migraciones iniciales. La app debe leer y mostrar `nombre_candidato`.

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
```

Crear migraciones nuevas en `supabase/migrations/NNNN_descripcion.sql`.
Mantener RLS habilitado y politicas restrictivas para escritura.

## 7. Supabase Auth y Storage

- Auth se usa para usuarios del equipo.
- La UI nunca muestra correos tecnicos ni menciones internas del proveedor.
- El login visible es `cedula + contraseña`. Internamente se transforma a `{cedula}@votoseguro.local`.
- La tabla `user_profiles` vincula Auth con cedula, datos del padron, territorio, `role` y `estado`.
- Roles iniciales: `admin` y `referente`.
- Estados iniciales: `activo` e `inactivo`.
- `admin` administra usuarios y candidatos, y ve todas las cargas de Voto Seguro.
- `referente` carga Voto Seguro y ve solo sus propias cargas.
- La Edge Function `admin-users` crea usuarios Auth y perfiles. Debe ejecutarse con `SUPABASE_SERVICE_ROLE_KEY` solo dentro de Supabase Functions o entorno backend seguro.
- El bootstrap del primer admin se hace con `scripts/bootstrap-current-admin.sql`; no hardcodear cedulas, UUIDs ni secretos en migraciones.
- Storage bucket de fotos de candidatos: `candidate-photos`.
- El frontend solo usa URL y publishable key.
- Service role, secret key, access tokens y passwords nunca van en frontend ni Vercel como `VITE_*`.

## 8. Variables de entorno

`.env.example`:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PADRON_API_URL=
```

En Vercel configurar solo variables necesarias para cliente con prefijo `VITE_`.
No configurar `SUPABASE_SERVICE_ROLE_KEY` en Vercel para esta app cliente. Las credenciales elevadas pertenecen a Supabase Edge Functions.

## 9. Padron

`src/lib/padronApi.ts` expone `buscarPorCedula(cedula)`.

Cuando exista fuente real:

- Si la API externa requiere secret o no tiene CORS, usar Supabase Edge Function como proxy.
- Si se importan DBF, crear tablas staging y luego tablas normalizadas.
- La pantalla `Padron` no debe convertirse en ABM de Voto Seguro.

## 10. Verificacion

Antes de cerrar un cambio:

- Ejecutar `npm run build`.
- Ejecutar `npm audit --audit-level=moderate`.
- Si se toca PWA, verificar `dist/manifest.webmanifest`, `dist/sw.js` y que los iconos respondan.
- Verificar que no se expongan secretos.
- Si se toca SQL, agregar y aplicar migracion correspondiente.
