# PLAN.md — Plan de implementación de GymHelper

> Hoja de ruta del proyecto. Se construye por **fases**, y cada fase se divide en **slices**: cada slice es una rebanada vertical (UI → lógica → datos) que hace UNA cosa de punta a punta, es testeable, y termina en un commit.
>
> **Regla de oro:** no le pases una fase entera a Claude Code de una sola vez. Pasale un slice, pedí el plan de archivos antes de codear, revisá, probá, commiteá, y recién ahí seguí.
>
> Contexto y convenciones en `CLAUDE.md`. Setup base según `setup.md`.
> Estado actual: **Fase 0 COMPLETA** ✅ (0.1–0.7). **Fase 1 COMPLETA** ✅ (1.1–1.4). **Fase 2 COMPLETA** ✅ (2.1–2.4). **Fase 3 COMPLETA** ✅ (3.1–3.6). **Fase 4 COMPLETA** ✅ (4.1–4.3). Prod: https://gymhelper-sage.vercel.app. Queda pendiente Fase 5 (backlog, no comprometido). Marcá `[x]` a medida que cerrás cada slice.

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
- [x] **1.2 — Media a Storage.** `scripts/seed-exercise-media.ts`: bucket público `exercise-media`, sube imágenes y GIFs (descargados del repo del dataset) a los paths ya guardados en `image_path`/`gif_path`. Usa `SUPABASE_SERVICE_ROLE_KEY` (Storage sí respeta control de acceso, a diferencia del insert directo por Postgres). Reanudable: hace `HEAD` a la URL pública antes de subir y saltea si ya existe. Concurrencia de 15. *Aceptación:* 2648/2648 archivos subidos (0 fallidos), GIFs/imágenes cargan público — verificado con ejemplos del principio y la mitad del dataset.
- [x] **1.3 — Listado con búsqueda y filtros.** `/exercises`: búsqueda por nombre (debounced, actualiza la URL), filtros por `body_part` (traducido es/en) y `equipment` (28 valores del dataset, sin traducir), paginación server-side (24/página, 56 páginas), thumbnails vía `next/image` + Supabase Storage. Mobile-first (grid de 2 columnas). *Aceptación:* busco "press" (7 páginas) + filtro chest (3 páginas), resultados correctos; verificado sin errores de servidor/consola.
- [x] **1.4 — Ficha de ejercicio.** `/exercises/[id]`: GIF (sin optimizar, preserva animación), músculo objetivo/principal/secundarios, equipamiento, instrucciones paso a paso en el idioma del usuario, **atribución a Gym Visual visible**, 404 si no existe. *Aceptación:* ficha completa en es y en; verificada con Barbell Bench Press en ambos idiomas, GIF carga, 404 en id inexistente. Nota: se renombró "muscleGroupLabel" a "Músculo principal"/"Primary muscle" para no duplicar la etiqueta de `bodyPartLabel`.

---

## Fase 2 — Rutinas

Objetivo: armar y gestionar rutinas: rutina → días → ejercicios con prescripción. **Fase COMPLETA** ✅

- [x] **2.1 — CRUD de rutinas.** Crear, renombrar, archivar. Listado en `/routines` (activas + sección de archivadas). *Aceptación:* gestiono mis rutinas; RLS probada. Nota: `/lib/db` conecta con el rol `postgres` del pooler (bypassea RLS) — toda query filtra `user_id` explícitamente en la app; además se verificó RLS "de verdad" con `supabase-js` + anon key autenticado como test2: `select()` sin filtro devuelve solo su propia rutina, leer/actualizar la rutina de test3 por id conocido devuelve `[]` sin afectar filas. Sin UI de borrado permanente en este slice (solo archivar).
- [x] **2.2 — Días de rutina.** `/routines/[id]`: agregar/renombrar/reordenar (subir/bajar, sin drag-and-drop)/borrar días dentro de una rutina, weekday opcional. Reordenar hace swap de `position` en una transacción. *Aceptación:* rutina "PPL" con 3 días nombrados y ordenados (Push/Pull/Legs), reordenados (Push/Legs/Pull), uno renombrado y otro borrado — probado en el navegador.
- [x] **2.3 — Ejercicios del día.** `/routines/[id]/days/[dayId]`: link "Agregar ejercicio" reutiliza `/exercises` en modo picker (`?dayId=`) con las mismas búsqueda/filtros de 1.3, botón "Agregar"/"✓ Agregado" por fila, se queda en la página para agregar varios seguidos. Prescripción por defecto 3×10 al agregar, editable inline (series/reps/descanso/notas). Reordenar con subir/bajar (misma transacción swap que 2.2), quitar. *Aceptación:* día "Push" con 5 ejercicios agregados, uno editado a 4×8-12·90s, reordenado y uno quitado — probado en el navegador. Nota: el reorder tarda ~2-3s (SELECT+2 UPDATE contra el pooler remoto); confirmar con espera antes de leer el resultado, no es un bug.
- [x] **2.4 — Vista de rutina.** `/routines/[id]` ahora muestra, debajo de cada día, sus ejercicios en línea (thumbnail 40×40 + nombre + series×reps·descanso), sin tener que entrar a cada día. Reutiliza `listRoutineExercises` (N+1 por día, aceptable para 3–7 días típicos). *Aceptación:* rutina "PPL" con Push (4 ejercicios con thumbnails y prescripción) y Leg Day (estado vacío) — probado en el navegador, sin errores.

---

## Fase 3 — Registro de sesiones (corazón de la app)

Objetivo: entrenar con la app en la mano: arrancar sesión, loguear serie por serie, cerrar. **Fase COMPLETA** ✅

- [x] **3.1 — Iniciar/cerrar sesión.** `/routines/[id]/days/[dayId]`: "Entrenar hoy" crea `workout_session` sobre ese `routine_day` y redirige a `/workout` (vista mínima: rutina/día, hora de inicio, cerrar). Si ya hay una sesión activa, no crea otra — resume la existente (probado: click en "Entrenar hoy" de un día distinto no duplica, sigue mostrando la sesión original). Cerrar setea `finished_at`. *Aceptación:* inicio, veo la sesión en curso, la cierro — verificado en el navegador y confirmado en la base (1 sola fila, `finished_at` seteado al cerrar).
- [x] **3.2 — Logger de series.** `/workout`: ejercicios del día en orden, cada uno con sus series ya logueadas (peso×reps, con "Quitar") y steppers (±2.5kg / ±1 rep, sin teclado) para la próxima serie. "Registrar serie" guarda esa serie al toque, sin submit final de toda la sesión. Al loguear, la siguiente serie precarga el mismo peso/reps (memoria de sesión; "la última vez" entre sesiones es 3.3). *Aceptación:* 3 series de "Archer Push Up" registradas y visibles al instante. Bug encontrado y corregido en la verificación: el próximo número de serie se calculaba por cantidad de filas (`logs.length + 1`), lo que repetía el número si se borraba una serie intermedia — ahora se calcula sobre `max(set_number) + 1`.
- [x] **3.3 — "La última vez".** `getLastTimeLog`: última serie (mayor `set_number`) de ese ejercicio en la sesión anterior más reciente (excluye la sesión actual). Se muestra en `muted` junto al objetivo, y el stepper de la primera serie precarga esos valores. Prioridad de defaults: serie previa de esta sesión (3.2) > la última vez (sesión anterior) > parseo del rango de reps. *Aceptación:* segunda sesión sobre "Push" muestra "La última vez: 30 kg × 8" para Archer Push Up (logueado en la sesión previa) y precarga el stepper con esos valores — verificado en el navegador cerrando una sesión y arrancando otra.
- [x] **3.4 — Conversión de unidades.** Vitest configurado por primera vez en el proyecto (no existía: `vitest.config.ts` + `npm test`/`test:watch`). `lib/workout/units.ts` (kg↔lb puro, redondeo a 1 decimal) + 7 tests, todos pasando. `/settings` (nuevo, mínimo: solo unidad — el resto llega en 4.3) persiste `users.unit_preference`. `/workout` y el `SetLogger` convierten para presentación (steppers en la unidad activa: ±2.5kg o ±5lb) sin tocar `weight_kg` en la base. *Aceptación:* tests pasan; cambié a lb en `/settings` y toda la UI de `/workout` (objetivo, "la última vez", series logueadas, stepper) mostró lb; verificado en la base que la fila nueva quedó en kg (32.3, conversión correcta de 71.1 lb). Nota: hay una diferencia de ~0.1lb en el round-trip de ida y vuelta kg→lb→kg por el redondeo a 1 decimal — esperado e inherente a cualquier sistema de doble unidad, no es un bug.
- [x] **3.5 — Historial.** `/history`: sesiones finalizadas (`finished_at` no nulo) ordenadas por fecha, con rutina/día, fecha/hora y resumen (`countDistinct` ejercicios + `count` series, pluralizado con ICU). `/history/[sessionId]`: detalle set por set agrupado por ejercicio (orden cronológico de la primera serie logueada), respeta la unidad de `/settings`. *Aceptación:* listado y detalle correctos — verificado con 4 sesiones reales de distintos días/horas; 404 al pedir por ID una sesión de otro usuario (test3 no accede a una sesión de test2); listado propio vacío para un usuario sin sesiones.
- [x] **3.6 — Dashboard.** Reemplaza el placeholder. Si hay sesión activa: banner "Continuar" (prioridad sobre todo lo demás). Si no: "Hoy: rutina — día" con CTA "Entrenar hoy" si el weekday de hoy (`new Date().getDay()`, hora del server — no hay timezone por usuario todavía) matchea algún día de una rutina activa; siempre además "Elegir otro día" con un botón de un tap por cada día de rutinas activas. Últimas 3 sesiones con link a `/history`. *Aceptación:* un tap desde el picker manual me llevó directo a `/workout` con la sesión iniciada — verificado en el navegador. Bug encontrado y corregido: `capitalize` (pensado solo para nombres de ejercicios en minúscula del dataset) se había aplicado por error a nombres de rutina/día y oraciones completas en 7 archivos (dashboard, workout, routines/[id], day, history×2) — barrido y corregido en toda la app.

---

## Fase 4 — PWA + pulido mobile

Objetivo: que se sienta app nativa en el gimnasio. **Fase COMPLETA** ✅

- [x] **4.1 — Manifest + instalable.** `app/manifest.ts` (name/short_name/start_url/`display: standalone`/background_color/theme_color/icons 192+512). Ícono propio (mancuerna sobre el acento `#ff5a1f`) generado con `next/og` `ImageResponse` en `scripts/generate-icons.tsx` (`npm run icons:generate`, sin dependencias nuevas) — reemplaza el favicon/apple-icon default de Next vía las convenciones `app/icon.png`/`app/apple-icon.png`. `viewport.themeColor` en `layout.tsx`. *Aceptación técnica verificada:* manifest servido y válido en `/manifest.webmanifest`, `<link rel="icon">`/`apple-touch-icon"` apuntando a los íconos nuevos (192/180px), `theme-color` correcto, sin errores. No se pudo probar la instalación real en un dispositivo Android/iOS desde este entorno — queda pendiente de confirmar por el usuario en su celular. Sin service worker (no pedido en este slice; PWA offline queda en el backlog de Fase 5).
- [x] **4.2 — Timer de descanso.** `RestTimer`: arranca solo (nunca en el mount inicial, sí en cada serie nueva vía `triggerKey` = id de la última serie) cuando el ejercicio tiene `rest_seconds` prescripto; cuenta regresiva real (`setTimeout` de 1s), "Saltar" para descartarlo sin afectar el resto, vibración (`navigator.vibrate`, con feature-check) + beep sintetizado con Web Audio (sin archivos de audio) al llegar a 0. *Aceptación:* corre con la pantalla abierta — verificado en el navegador: timer arrancó en 90s tras loguear la Serie 1 de "Archer Push Up", descontó en tiempo real, "Saltar" lo descartó sin tocar el resto, y la Serie 2 arrancó un timer nuevo en 90s (no continuó desde donde se saltó). Sin errores.
- [x] **4.3 — Ajustes completos.** `/settings`: idioma (reutiliza `LocaleSwitcher`; `lib/i18n/actions.ts` ahora persiste en `users.locale` además de la cookie, no solo desde /settings — cualquier cambio de idioma en la app viaja entre dispositivos), unidad (ya existía desde 3.4), cuenta (alcance acordado con el usuario: solo mostrar el email — sin cambio de contraseña ni borrado de cuenta en este slice). *Aceptación:* verificado borrando la cookie de locale manualmente y recargando — la app cayó al valor guardado en `users.locale` (inglés) en vez del default ('es'), probando que la preferencia persiste sin depender del navegador/dispositivo.

---

## Fase 5 — Futuro (no comprometido)

Backlog explícito. No arrancar sin decidirlo antes.

- [ ] **Progreso y estadísticas.** Evolución de peso por ejercicio, volumen semanal por grupo muscular, PRs.
- [ ] **Generación de rutinas con IA.** LLM sugiere rutina según objetivo/equipamiento/días; el código valida contra el catálogo. (Regla: la IA sugiere, el código valida.)
- [ ] **Logging offline.** Cache local + cola de sync para gimnasios sin señal.
- [ ] **Plantillas de rutina compartibles.** Duplicar/compartir rutinas entre usuarios.
