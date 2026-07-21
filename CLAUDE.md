# CLAUDE.md — GymHelper

> Este archivo es el **contexto persistente** del proyecto. Claude Code lo lee al inicio de cada sesión.
> Mantenelo actualizado cuando cambien decisiones de fondo (nueva tabla, nueva convención, cambio de stack).
> NO va el detalle de tareas acá — eso vive en `PLAN.md`. El proyecto se construye por fases; ver `PLAN.md`.
> El setup inicial sigue el runbook de `setup.md` (template de `C:\Proyects\templates`).

@AGENTS.md

---

## Qué es GymHelper

App para **administrar rutinas de gimnasio y registrar entrenamientos**. El usuario arma sus rutinas eligiendo ejercicios de un catálogo de 1.324 ejercicios (dataset [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)), y cuando entrena registra serie por serie qué peso y cuántas reps hizo. Multi-usuario abierto: cualquiera se registra y gestiona lo suyo.

Uso principal: **desde el celular, en el gimnasio**. Mobile-first, PWA instalable (sin offline por ahora).

Las dos preguntas que responde la app: "¿qué me toca hoy?" y "¿cuánto levanté la última vez?".

---

## Stack

- **Next.js (App Router) + TypeScript** — full-stack en un repo.
- **Supabase** — Postgres + Auth + Row Level Security + **Storage** (media de ejercicios).
- **Drizzle ORM** — acceso a datos tipado. Nunca SQL crudo en componentes.
- **Tailwind CSS v4** — estilos.
- **Zod** — validación de inputs (formularios, route handlers y el seed del dataset).
- **next-intl** — i18n español/inglés, **sin prefijo de URL** (cookie + `users.locale`). Default: `es`.
- **Vitest** — tests junto al código (`*.test.ts`).
- **Deploy:** Vercel.
- **Sin LLM por ahora.** Si algún día se agrega generación de rutinas con IA, sigue la regla del template: la IA sugiere, el código valida.

---

## Estructura de carpetas

```
/app
  /(auth)            login, signup
  /(app)             rutas autenticadas
    /dashboard       qué me toca hoy + sesión en curso
    /exercises       catálogo: búsqueda, filtros, ficha
    /routines        CRUD de rutinas, días y ejercicios
    /workout         sesión de entrenamiento activa (logging)
    /history         sesiones pasadas
    /settings        idioma, unidad de peso
    layout.tsx       guard de sesión
  /api               route handlers (solo cuando hace falta)
/components
  /ui                primitivas reutilizables (botón, card, input)
  /features          componentes por dominio (exercise-card, set-logger, routine-editor)
/lib
  /db                schema drizzle, cliente, queries
  /supabase          clientes server/browser
  /workout           lógica pura: conversión kg↔lb, resúmenes de sesión — SIN I/O
  /validations       schemas zod
/messages            es.json, en.json (traducciones next-intl)
/scripts
  seed-exercises.ts  importa el dataset a `exercises` + sube media a Storage
/types
```

---

## Convenciones de código

- **Server Components por defecto.** `'use client'` solo con interactividad real (el logger de series lo es; el catálogo casi no).
- **Acceso a datos siempre vía `/lib/db`.** Componentes y páginas no escriben queries sueltas.
- **Toda tabla tiene RLS activa.** Tablas de usuario: solo filas propias. `exercises` es global: **SELECT para autenticados, sin escritura** (solo el seed con service role).
- **`/lib/workout` es lógica pura y testeable.** Sin base ni red. Tests con Vitest (`npm test`).
- **Validación con Zod en el borde.** Todo input de usuario se valida antes de tocar la base. El seed valida el dataset contra su propio schema antes de insertar.
- **Peso siempre en kg en la base** (`weight_kg` numeric). La conversión a lb es solo de presentación, en `/lib/workout`.
- **Textos de UI siempre vía next-intl** (`useTranslations`/`getTranslations`). Nada de strings hardcodeados en componentes. Las instrucciones de ejercicios vienen del jsonb `instructions`/`instruction_steps` según `users.locale`.
- **Atribución de media:** toda vista que muestre imagen/GIF de un ejercicio muestra la atribución a Gym Visual (campo `attribution`). Es condición de la licencia del dataset. **No comercializar la app sin licenciar la media.**
- **Sesión:** `proxy.ts` (raíz) refresca la sesión de Supabase en cada request (Next 16: `middleware`→`proxy`). Guard en `app/(app)/layout.tsx`. En dev, confirmación de email desactivada en Supabase.
- **TypeScript estricto.** Sin `any` salvo justificación.
- **Commits chicos y atómicos**, uno por slice terminado y funcionando. Formato: `feat:`, `fix:`, `chore:`, `refactor:`.
- **Estándar visual en `DESIGN.md`** (se define en Fase 0.6). Tokens, nunca colores crudos.

---

## Modelo de datos

Definir en `/lib/db/schema.ts` con Drizzle. Todas las tablas con `id` (uuid), `created_at`, `updated_at`.

### `users`
Perfil + configuración. (La auth la maneja Supabase; esta tabla guarda lo del dominio.)
- `id` (uuid, = auth.uid) — **FK a `auth.users(id)` con `on delete cascade`**.
- `email`
- `locale` — enum: `es` | `en` (default `es`)
- `unit_preference` — enum: `kg` | `lb` (default `kg`)

> **Sincronización auth → dominio:** trigger `on_auth_user_created` (función `handle_new_user`, SECURITY DEFINER) inserta la fila en `public.users` al registrarse. Vive en migraciones custom de Drizzle.

### `exercises` — catálogo global (seed, solo lectura)
Los 1.324 ejercicios del dataset. **Sin `user_id`**: es compartida por todos.
- `id` (uuid)
- `dataset_id` (text, **único** — el id `0001`…`1324` del dataset; clave de idempotencia del seed)
- `name` (text)
- `body_part` — enum del dataset: `back` | `cardio` | `chest` | `lower arms` | `lower legs` | `neck` | `shoulders` | `upper arms` | `upper legs` | `waist`
- `target` (text — músculo principal)
- `muscle_group` (text)
- `secondary_muscles` (text[])
- `equipment` (text)
- `instructions` (jsonb — **solo `{es, en}`**; descartamos los otros 8 idiomas del dataset)
- `instruction_steps` (jsonb — `{es: string[], en: string[]}`)
- `image_path`, `gif_path` (text — paths dentro del bucket `exercise-media`)
- `attribution` (text — copyright Gym Visual, se muestra en UI)

RLS: SELECT para cualquier usuario autenticado; INSERT/UPDATE/DELETE denegados (el seed usa service role).

### `routines`
- `id`, `user_id` (fk)
- `name` (ej. "PPL", "Upper/Lower")
- `notes` (nullable)
- `archived_at` (timestamptz nullable — archivar en vez de borrar si tiene historial)

### `routine_days`
Un día de entrenamiento dentro de una rutina.
- `id`, `routine_id` (fk, cascade)
- `name` (ej. "Push", "Pierna")
- `weekday` (int 0–6, nullable — opcionalmente atado a un día de la semana)
- `position` (int — orden dentro de la rutina)

### `routine_exercises`
Un ejercicio dentro de un día, con su prescripción.
- `id`, `routine_day_id` (fk, cascade), `exercise_id` (fk a `exercises`)
- `position` (int — orden en el día)
- `target_sets` (int)
- `target_reps` (text — rango libre: "8-12", "5", "AMRAP")
- `rest_seconds` (int, nullable)
- `notes` (nullable)

### `workout_sessions`
Una visita al gimnasio.
- `id`, `user_id` (fk)
- `routine_day_id` (fk, **on delete set null** — si borrás el día de la rutina, el historial queda)
- `started_at`, `finished_at` (timestamptz, `finished_at` null mientras está en curso)
- `notes` (nullable)

### `set_logs`
Cada serie registrada. **Referencia al ejercicio directo, no a `routine_exercises`** — editar la rutina nunca rompe el historial.
- `id`, `user_id` (fk — denormalizado para RLS simple), `session_id` (fk, cascade), `exercise_id` (fk)
- `set_number` (int — 1, 2, 3…)
- `weight_kg` (numeric — siempre kg; 0 = peso corporal)
- `reps` (int)
- `notes` (nullable)

---

## Dataset y media (decisiones de licencia)

- Fuente: https://github.com/hasaneyldrm/exercises-dataset — JSON (MIT para código/textos) + imágenes 180×180 y GIFs (© Gym Visual, incluidos con permiso a resolución reducida, **atribución obligatoria**).
- Seed: `scripts/seed-exercises.ts` clona/descarga el dataset, valida contra su JSON Schema (con Zod), upserta por `dataset_id`, y sube media al bucket público `exercise-media` de Supabase Storage.
- El seed es **idempotente**: correrlo dos veces no duplica nada.
- Si el proyecto se comercializa algún día, hay que licenciar la media con Gym Visual o reemplazarla.

---

## Cómo trabajar conmigo (recordatorio para cada sesión)

1. Antes de codear un slice, proponé un **plan de archivos y cambios**. Esperá OK.
2. Un slice = una cosa de punta a punta. No mezclar features.
3. Al terminar un slice: que la app corra, probarlo, y commit.
4. Si una decisión cambia el modelo de datos o una convención, actualizá este archivo.
