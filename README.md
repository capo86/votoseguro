# VotoSeguro PPC

Aplicacion web mobile-first para trabajo territorial electoral del PPC, Partido de la Participacion Ciudadana.

La app permite gestionar usuarios operativos, candidatos, carga de Voto Seguro, consulta de padron y resumen administrativo. Esta preparada como PWA online-first para instalarse en Android/iOS.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS con tema claro/oscuro
- Zustand para estado global
- Supabase para Auth, Postgres y Storage
- TanStack Table para grillas
- Recharts para graficos del resumen
- Leaflet/OpenStreetMap para ubicacion
- vite-plugin-pwa + Workbox para PWA
- Vercel para deploy

## Requisitos

- Node.js compatible con el proyecto
- npm
- Proyecto Supabase configurado
- Variables locales en `.env.local`

## Variables de entorno

Crear `.env.local` a partir de `.env.example`:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PADRON_API_URL=
```

Solo usar variables `VITE_*` que puedan quedar expuestas al navegador. No guardar service role, secret keys, passwords ni access tokens en el frontend.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run pwa:assets
npm audit --audit-level=moderate
```

- `npm run dev`: servidor local Vite.
- `npm run build`: compila TypeScript y genera `dist`.
- `npm run preview`: sirve el build local.
- `npm run pwa:assets`: regenera iconos PWA desde `logo ppc oficial.png`.

## PWA

La app es PWA online-first:

- Es instalable en Android/iOS.
- Usa `manifest.webmanifest` generado por `vite-plugin-pwa`.
- Registra service worker con auto-update.
- Cachea interfaz y assets estaticos.
- No cachea Supabase/Auth/API ni datos sensibles.
- Las cargas y consultas requieren conexion.

Los iconos estan en `public/pwa/` y se generan desde el logo oficial:

- `ppc-logo-192.png`
- `ppc-logo-512.png`
- `ppc-logo-maskable-192.png`
- `ppc-logo-maskable-512.png`
- Apple touch icons
- Favicons
- `splash-logo.png`

Si cambia el logo, ejecutar:

```bash
npm run pwa:assets
npm run build
```

## Deploy

Produccion:

```txt
https://votoseguro-two.vercel.app/
```

Deploy manual:

```bash
npx vercel --prod --yes
```

Antes de publicar:

```bash
npm run build
npm audit --audit-level=moderate
```

Verificar:

- `/manifest.webmanifest`
- `/sw.js`
- `/pwa/ppc-logo-512.png`
- `/og-votoseguro-ppc.png`

## Convenciones

- UI mobile-first.
- Usar `lucide-react` para iconos.
- Usar el naranja PPC `#F2820C` como acento principal.
- Mostrar el menu administrativo como `Resumen`.
- Footer visible: `Creado por Cleto Perez y Juan Bellenzier`.
- No mostrar menciones tecnicas del proveedor a usuarios finales.
- No exponer secretos en repo, Vercel ni variables `VITE_*`.

## Seguridad

- El frontend solo debe usar URL publica y publishable key.
- Service role y secrets solo pertenecen a Supabase Edge Functions o backend seguro.
- Revisar secretos antes de commitear:

```bash
rg -n "sb_secret|service_role|SUPABASE_SERVICE|password|access token|DATABASE_URL" .
```

