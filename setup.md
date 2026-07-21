# setup.md — Runbook de fundaciones para apps full-stack

> Plan de implementación reusable para arrancar una app nueva con el mismo
> esqueleto que **EnergyOS** (`C:\Proyects\EnergyOS`). No es específico de esa
> app: es la "Fase 0" generalizada, con los puntos donde cada pieza del stack
> se puede reemplazar por otra sin romper el resto del esqueleto.
>
> Uso: copiar este archivo a la raíz del proyecto nuevo (o dejarlo acá como
> referencia), seguir los pasos en orden, y una vez cerrada la Fase 0 crear
> el `CLAUDE.md` y `PLAN.md` propios del proyecto (ver plantillas al final).

---

## Cuándo usar este runbook

Sirve para apps donde:
- Hay un usuario autenticado con datos propios (multi-tenant por usuario).
- El valor central es lógica de dominio calculable en código (reglas,
  estadística, scoring), no solo CRUD.
- Un LLM puede sumar (narrativa, resúmenes) pero **no** es el motor de cálculo.
- El deploy es serverless/edge, sin infraestructura propia que mantener.

Si el proyecto no cumple esto (ej. necesita un backend con estado persistente
fuera de Postgres, colas, workers pesados, etc.), este esqueleto es punto de
partida pero va a necesitar piezas extra no cubiertas acá.

---

## Stack base y puntos de reemplazo

| Rol | Elección base | Alternativas razonables | Cuándo cambiar |
|---|---|---|---|
| Framework full-stack | **Next.js (App Router) + TypeScript** | Remix, SvelteKit | Casi nunca — Next.js + Vercel es el combo con menos fricción |
| DB + Auth + RLS | **Supabase** (Postgres + Auth + Row Level Security) | Neon/Postgres + Auth.js o Clerk; Firebase | Si ya hay un IdP corporativo (usar Clerk/Auth0) o si no hace falta RLS multi-usuario |
| ORM | **Drizzle** | Prisma | Prisma si el equipo ya lo conoce bien; Drizzle si se prioriza SQL explícito y control fino |
| Estilos | **Tailwind CSS v4** | CSS Modules, vanilla-extract | Rara vez — Tailwind acelera mucho la fase de diseño |
| Validación | **Zod** | Valibot | Valibot si el bundle size es crítico |
| LLM (solo narrativa/texto) | **API de Anthropic** | API de OpenAI | Según qué proveedor ya tenga cuenta/billing el proyecto |
| Deploy | **Vercel** | Netlify, Railway, Fly.io | Railway/Fly si se necesita un proceso long-running (workers, cron pesado) |
| Notificaciones push | **web-push (VAPID)** | OneSignal, Firebase Cloud Messaging | OneSignal si se necesita push también en apps nativas |
| Tests | **Vitest** | Jest | Vitest por defecto en proyectos Vite/Next modernos |

La tabla es la única parte "genérica" del documento: los pasos de abajo asumen
la columna del medio (la elección base). Si se reemplaza una pieza, el resto
de la estructura de carpetas y convenciones se mantiene igual.

---

## Paso 0 — Prerrequisitos

- Cuenta en Supabase (o el reemplazo de DB/Auth elegido).
- Cuenta en Vercel (o el reemplazo de deploy elegido), conectada a GitHub.
- Node LTS instalado.
- Si hay narrativa con LLM: API key del proveedor elegido.

---

## Paso 1 — Scaffold

```bash
npx create-next-app@latest <nombre-proyecto> --typescript --tailwind --eslint --app
cd <nombre-proyecto>
```

Estructura de carpetas objetivo (crear los directorios vacíos ahora, aunque
queden sin archivos hasta que se necesiten):

```
/app
  /(auth)            login, signup — sin layout autenticado
  /(app)             rutas que requieren sesión
    layout.tsx       guard de sesión (getUser() + redirect si no hay)
  /api               route handlers (solo cuando un Server Component/Action no alcanza)
/components
  /ui                primitivas reutilizables (botón, card, input) — sin lógica de dominio
  /features          componentes por dominio, uno por feature
/lib
  /db                schema del ORM, cliente, queries — único punto de acceso a datos
  /supabase          (o el cliente de auth/DB elegido) clientes server/browser
  /<dominio>         lógica de negocio pura — sin I/O, testeable sin mocks
  /validations       schemas de validación (Zod/Valibot)
/types
```

*Aceptación del paso:* `npm run dev` levanta una página en blanco sin errores.

---

## Paso 2 — DB + Auth (Supabase u homólogo)

1. Crear el proyecto en Supabase.
2. Variables de entorno en `.env.local` (nunca commiteado; sí un `.env.example`
   con los nombres de las variables vacíos):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=   # solo server-side, nunca en el cliente
   DATABASE_URL=                # para el ORM/migraciones
   ```
3. Clientes en `/lib/supabase`: uno para Server Components/Actions, uno para
   Client Components. No mezclar.
4. En dev, si el flujo de confirmación de email frena las pruebas, se puede
   desactivar desde el panel de Supabase (recordar reactivarlo en prod).

*Aceptación:* se puede hacer una query trivial a la DB desde un Server Component.

---

## Paso 3 — ORM + schema inicial (Drizzle u homólogo)

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

`drizzle.config.ts` apuntando a `DATABASE_URL` y a `/lib/db/schema.ts`.

Convenciones de schema:
- Toda tabla tiene `id` (uuid), `created_at`, `updated_at`.
- Toda tabla con datos de usuario tiene `user_id` (fk) y **RLS activa** desde
  el día uno — no se posterga "para después".
- Si el auth lo maneja un servicio externo (Supabase Auth, Clerk), la tabla de
  dominio `users` tiene `id` = uuid del proveedor de auth, con
  `on delete cascade`, y un trigger/webhook sincroniza la creación (ej.
  `on_auth_user_created` en Supabase).

```bash
npm run db:generate   # drizzle-kit generate
npm run db:migrate    # drizzle-kit migrate
```

*Aceptación:* las tablas existen en la base y tienen políticas RLS.

---

## Paso 4 — Auth flow

- Signup, login, logout con el proveedor elegido.
- Layout de rutas autenticadas (`app/(app)/layout.tsx`) que verifica sesión
  server-side y redirige a `/login` si no hay.
- Middleware/proxy que refresca la sesión en cada request (en Next.js 16 el
  archivo se llama `proxy.ts` en la raíz, antes `middleware.ts`).

*Aceptación:* puedo registrarme, entrar, ver una ruta protegida, y sin sesión
me redirige.

---

## Paso 5 — Validación en el borde

- Un schema de validación (Zod/Valibot) por cada input de usuario (formulario
  o route handler), en `/lib/validations`.
- Nunca confiar en datos del cliente sin validar antes de tocar la base.

---

## Paso 6 — Motor de dominio (si aplica)

Si el proyecto tiene lógica de negocio no trivial (reglas, scoring,
correlaciones, recomendaciones):
- Vive en `/lib/<dominio>` como **lógica pura**: recibe datos, devuelve
  resultados, sin acceso a red ni base.
- Esto permite testearlo sin mocks.
- Tests con Vitest, viviendo junto al código (`*.test.ts`).

```bash
npm install -D vitest
npm run test        # vitest run
npm run test:watch  # vitest
```

---

## Paso 7 — LLM (si aplica)

- Cliente del SDK del proveedor (Anthropic/OpenAI), **solo server-side** — la
  API key nunca llega al cliente.
- Regla de oro: **el LLM no calcula, solo redacta.** Los números/correlaciones
  se calculan en el motor de dominio (paso 6) y se le pasan ya resueltos al
  prompt. Esto evita alucinaciones en cifras y hace el output determinista de
  probar.

---

## Paso 8 — Sistema de diseño mínimo

Antes de construir pantallas, fijar en un `DESIGN.md`:
- Paleta como tokens CSS (`bg-surface`, `text-muted`, `bg-accent`...), nunca
  colores crudos sueltos en componentes.
- Tipografía y jerarquía (1-2 familias, peso y tamaño para títulos/cuerpo).
- Radios, espaciado (grilla de 8px), profundidad (bordes vs. sombras).
- Tema claro/oscuro: decidir si sigue `prefers-color-scheme` o es manual.

Esto evita que cada pantalla nueva invente su propia paleta.

---

## Paso 9 — Deploy

- Conectar el repo a Vercel (u homólogo).
- Cargar las mismas variables de entorno que en `.env.local`.
- Primer deploy y verificación de que el login funciona en la URL pública.

*Aceptación:* la app vive en una URL pública y el flujo de auth funciona ahí.

---

## Convenciones de código (aplican indistintamente del stack elegido)

- **Server Components por defecto.** `'use client'` solo cuando hay
  interactividad real (formularios, estado local).
- **Acceso a datos siempre vía `/lib/db`.** Ninguna página o componente
  escribe queries sueltas.
- **RLS (o el equivalente de autorización por fila) activa en toda tabla**
  desde que se crea, no como paso posterior.
- **TypeScript estricto**, sin `any` salvo justificación en comentario.
- **Commits chicos y atómicos**, uno por slice terminado y funcionando.
  Formato: `feat:`, `fix:`, `chore:`, `refactor:`.

---

## Cómo trabajar el proyecto una vez armada la Fase 0

1. Definir `PLAN.md`: fases → slices. Un slice = una cosa de punta a punta
   (UI → lógica → datos), testeable, termina en un commit.
2. Definir `CLAUDE.md` (o equivalente): contexto persistente del proyecto —
   qué es, stack elegido de la tabla de arriba, estructura de carpetas,
   convenciones, modelo de datos. Se actualiza cuando cambia una decisión de
   fondo.
3. Regla de oro al ejecutar slices con un agente: no pasarle una fase entera
   de una — pasarle un slice, pedir el plan de archivos antes de codear,
   revisar, probar, commitear, y recién ahí seguir con el próximo.

---

## Checklist resumen (Fase 0)

- [ ] Scaffold Next.js + TS + Tailwind, estructura de carpetas creada
- [ ] DB + Auth conectados, variables de entorno documentadas en `.env.example`
- [ ] ORM instalado, schema inicial migrado, RLS activa
- [ ] Signup/login/logout funcionando, guard de rutas autenticadas
- [ ] Validación en el borde para el primer input de usuario
- [ ] (si aplica) Motor de dominio puro + primer test
- [ ] (si aplica) Integración LLM server-side, solo narrativa
- [ ] `DESIGN.md` con paleta/tipografía/espaciado mínimos
- [ ] Deploy funcionando en URL pública
- [ ] `PLAN.md` y `CLAUDE.md` del proyecto creados

---

*Basado en los patrones validados en EnergyOS (`C:\Proyects\EnergyOS`,
`CLAUDE.md`/`DESIGN.md`/`PLAN.md`), generalizados para reusarse en proyectos
nuevos con stack equivalente o reemplazado según la tabla de la sección 2.*
