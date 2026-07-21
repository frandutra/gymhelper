# PLAN.md — Plan de implementación de GymHelper

> Hoja de ruta del proyecto. Se construye por **fases**, y cada fase se divide en **slices**: cada slice es una rebanada vertical (UI → lógica → datos) que hace UNA cosa de punta a punta, es testeable, y termina en un commit.
>
> **Regla de oro:** no le pases una fase entera a Claude Code de una sola vez. Pasale un slice, pedí el plan de archivos antes de codear, revisá, probá, commiteá, y recién ahí seguí.
>
> Contexto y convenciones en `CLAUDE.md`. Setup base según `setup.md`.
> Estado actual: **Fase 0 COMPLETA** ✅ (0.1–0.7). **Fase 1 en curso** (1.1 completo). Prod: https://gymhelper-sage.vercel.app. Marcá `[x]` a medida que cerrás cada slice de las próximas fases.

---

## Fase 0 — Fundaciones

Objetivo: que el proyecto arranque, se conecte a la base y deployee. Sigue `setup.md` pasos 1–5, 8 y 9.

- [x] **0.1 — Scaffold.** Next.js (App Router) + TypeScript + Tailwind v4. Estructura de carpetas según `CLAUDE.md`. ⚠️ `create-next-app` falla con `.md` sueltos en la carpeta: mover `CLAUDE.md`/`PLAN.md`/`setup.md` afuera, scaffoldear, y devolverlos (o scaffoldear en carpeta temporal y mover el contenido). *Aceptación:* `npm run dev` levanta una página en blanco sin errores.
- [x] **0.2 — Supabase.** Proyecto en Supabase, clientes server/browser en `/lib/supabase`, `.env.local` + `.env.example`. *Aceptación:* query trivial desde un Server Component.
- [x] **0.3 — Drizzle + schema completo.** Todas las tablas de `CLAUDE.md` (users, exercises, routines, routine_days, routine_exercises, workout_sessions, set_logs) con RLS y el trigger `on_auth_user_created`. *Aceptación:* tablas y políticas existen en Supabase.
- [x] **0.4 — Auth.** Signup, login, logout. Guard en `app/(app)/layout.tsx` + `proxy.ts`. *Aceptación:* registro → ruta protegida; sin sesión redirige. "Confirm email" desactivado en Supabase: el registro abre sesión directo.
- [x] **0.5 — i18n base.** next-intl sin prefijo de URL: cookie de locale, `/messages/es.json` + `en.json`, layout que resuelve el locale (cookie → `users.locale` → `es`). Selector mínimo en una página de prueba. *Aceptación:* la misma página se ve en es/en al cambiar el selector.
- [x] **0.6 — DESIGN.md.** Definir paleta (tokens CSS + `@theme` Tailwind), tipografía, radios, espaciado, tema claro/oscuro. Pensado para uso mobile en gimnasio: alto contraste, targets táctiles grandes (mínimo 44px), números legibles (`tabular-nums`). *Aceptación:* archivo escrito y tokens funcionando en `globals.css`.
- [x] **0.7 — Deploy.** Repo en GitHub, Vercel, env vars, primer deploy. *Aceptación:* login funciona en la URL pública. Prod: https://gymhelper-sage.vercel.app — repo: https://github.com/frandutra/gymhelper

---

## Fase 1 — Catálogo de ejercicios

Objetivo: el dataset vivo dentro de la app: buscar, filtrar y ver cualquier ejercicio con su GIF e instrucciones.

- [x] **1.1 — Seed del dataset.** `scripts/seed-exercises.ts`: descarga el dataset, valida con Zod, recorta `instructions`/`instruction_steps` a `{es, en}`, upserta por `dataset_id` (`onConflictDoUpdate`). *Aceptación:* `SELECT count(*) FROM exercises` = 1324; correr el seed dos veces no duplica. Nota: el insert usa el cliente Drizzle directo (rol `postgres` del pooler ya bypassea RLS) — no hizo falta la service role key para este slice; queda reservada para el upload a Storage en 1.2. `image_path`/`gif_path` ya quedaron seteados con los paths del dataset origen (`images/000X-xxx.jpg`); en 1.2 se sube el binario a esos mismos paths en el bucket propio.
- [ ] **1.2 — Media a Storage.** Crear bucket público `exercise-media`, subir imágenes y GIFs a los mismos paths ya guardados en `image_path`/`gif_path` (1.1). Requiere `SUPABASE_SERVICE_ROLE_KEY` (Storage sí pasa por políticas de acceso, a diferencia del insert directo por Postgres). Subida reanudable (skip si ya existe). *Aceptación:* un GIF cualquiera carga desde la URL pública del bucket.
- [ ] **1.3 — Listado con búsqueda y filtros.** `/exercises`: búsqueda por nombre, filtros por `body_part` y `equipment`, paginación server-side, thumbnails. Mobile-first. *Aceptación:* busco "press", filtro por chest, y los resultados son correctos y rápidos.
- [ ] **1.4 — Ficha de ejercicio.** `/exercises/[id]`: GIF, músculos objetivo y secundarios, equipamiento, instrucciones paso a paso en el idioma del usuario, **atribución a Gym Visual visible**. *Aceptación:* la ficha se ve completa en es y en en.

---

## Fase 2 — Rutinas

Objetivo: armar y gestionar rutinas: rutina → días → ejercicios con prescripción.

- [ ] **2.1 — CRUD de rutinas.** Crear, renombrar, archivar (no borrar si tiene historial). Listado en `/routines`. *Aceptación:* gestiono mis rutinas; RLS probada (un usuario no ve rutinas de otro).
- [ ] **2.2 — Días de rutina.** Agregar/renombrar/reordenar/borrar días dentro de una rutina, weekday opcional. *Aceptación:* una rutina "PPL" con 3 días nombrados y ordenados.
- [ ] **2.3 — Ejercicios del día.** Selector de ejercicios (reusa búsqueda/filtros de 1.3) para agregar al día; definir series objetivo, rango de reps, descanso; reordenar; quitar. *Aceptación:* un día Push con 5 ejercicios prescriptos en el orden que elegí.
- [ ] **2.4 — Vista de rutina.** Vista completa de la rutina lista para usar: días con sus ejercicios, prescripción y thumbnails. *Aceptación:* la rutina se lee cómoda en el celular.

---

## Fase 3 — Registro de sesiones (corazón de la app)

Objetivo: entrenar con la app en la mano: arrancar sesión, loguear serie por serie, cerrar.

- [ ] **3.1 — Iniciar/cerrar sesión.** Desde el dashboard o la rutina: "Entrenar hoy" crea `workout_session` sobre un `routine_day`. Cerrar setea `finished_at`. Una sola sesión en curso a la vez. *Aceptación:* inicio, veo la sesión en curso, la cierro.
- [ ] **3.2 — Logger de series.** UI de sesión activa: ejercicios del día en orden, registrar peso × reps por serie con inputs rápidos (steppers, no teclado libre). Guardado inmediato por serie (sin "submit" final). *Aceptación:* registro 3 series de un ejercicio en menos de 20 segundos.
- [ ] **3.3 — "La última vez".** Al loguear un ejercicio, mostrar peso/reps de la sesión anterior de ese ejercicio, y pre-cargar el stepper con ese peso. *Aceptación:* la segunda sesión muestra los datos de la primera.
- [ ] **3.4 — Conversión de unidades.** `/lib/workout`: kg↔lb puro + tests. Ajuste en `/settings` (`unit_preference`). La base siempre en kg. *Aceptación:* tests pasan; cambiar a lb convierte toda la UI sin tocar datos.
- [ ] **3.5 — Historial.** `/history`: sesiones pasadas con fecha, día de rutina, resumen (ejercicios, series totales); detalle por sesión. *Aceptación:* veo qué hice la semana pasada.
- [ ] **3.6 — Dashboard.** "¿Qué me toca hoy?": día de rutina según weekday (o elegir a mano), acceso a sesión en curso, últimas sesiones. *Aceptación:* abro la app y en un tap estoy entrenando.

---

## Fase 4 — PWA + pulido mobile

Objetivo: que se sienta app nativa en el gimnasio.

- [ ] **4.1 — Manifest + instalable.** `app/manifest.ts`, íconos, `display: standalone`, theme color. *Aceptación:* "Agregar a inicio" en Android/iOS y abre sin chrome del browser.
- [ ] **4.2 — Timer de descanso.** Al completar una serie, timer opcional con el `rest_seconds` prescripto; notificación/vibración al terminar. *Aceptación:* el timer corre con la pantalla del logger abierta.
- [ ] **4.3 — Ajustes completos.** `/settings`: idioma (persiste en `users.locale`), unidad, gestión de cuenta. *Aceptación:* preferencias persisten entre dispositivos.

---

## Fase 5 — Futuro (no comprometido)

Backlog explícito. No arrancar sin decidirlo antes.

- [ ] **Progreso y estadísticas.** Evolución de peso por ejercicio, volumen semanal por grupo muscular, PRs.
- [ ] **Generación de rutinas con IA.** LLM sugiere rutina según objetivo/equipamiento/días; el código valida contra el catálogo. (Regla: la IA sugiere, el código valida.)
- [ ] **Logging offline.** Cache local + cola de sync para gimnasios sin señal.
- [ ] **Plantillas de rutina compartibles.** Duplicar/compartir rutinas entre usuarios.
