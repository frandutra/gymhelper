# DESIGN.md — Estándar visual de GymHelper

> Cómo se ve y se siente GymHelper. Toda UI nueva sigue esto. Si cambia una
> decisión de fondo (paleta, tipografía, tono), actualizar este archivo.

## Principio

Energético y directo, pensado para usarse **con una mano, entre series, en el
gimnasio**. Alto contraste, texto grande donde importa (peso, reps), cero
fricción para tocar el botón correcto sin mirar dos veces. Nunca "wellness
calmo" — esto es una bitácora de esfuerzo, no un diario de bienestar.

## Paleta

Un solo acento vivo (naranja-rojo "ignite") sobre neutros casi puros. Sigue
`prefers-color-scheme`: el dark es el look primario (gimnasio a las 6am o de
noche), el light usa los mismos valores de acento sobre neutros claros.

| Rol | Token | Claro | Oscuro |
|---|---|---|---|
| Fondo | `background` | `#f4f4f5` | `#0d0d0f` |
| Superficie (cards) | `surface` | `#ffffff` | `#17171a` |
| Texto principal | `foreground` | `#111113` | `#f5f4f2` |
| Texto secundario | `muted` | `#6b6b70` | `#8b8b90` |
| Bordes / tracks | `border` | `#e2e2e6` | `#2a2a2e` |
| Acento | `accent` | `#ff5a1f` | `#ff5a1f` |
| Texto sobre acento | `accent-foreground` | `#0d0d0f` | `#0d0d0f` |
| Acento hover | `accent-hover` | `#e6480d` | `#ff7440` |

**Regla del acento:** el naranja es el único color saturado; se usa como
**relleno** (botón primario, CTA "Entrenar hoy", número del set activo),
nunca como texto largo. Lleva texto `accent-foreground` (casi negro, no
blanco: más contraste y más "cinta de precaución" energético) encima.
En hover se oscurece en claro y se aclara en oscuro — siempre hacia más
intensidad perceptible, nunca hacia gris.

Los tokens viven en `app/globals.css` (variables CSS + `@theme` de Tailwind
v4). Se usan como utilidades: `bg-background`, `bg-surface`,
`text-foreground`, `text-muted`, `border-border`, `bg-accent`,
`text-accent-foreground`, `hover:bg-accent-hover`. **No usar colores crudos**
(`zinc-*`/`gray-*`/hex sueltos).

## Tipografía

- **Geist Sans** para todo (UI y cuerpo). Geist Mono no se usa: los números
  van en Geist Sans con `tabular-nums`, más integrados con el resto de la UI.
- Títulos: `font-extrabold tracking-tight`, color `foreground`.
- Cuerpo secundario: `text-muted`.
- **Números de peso/reps** (el contenido más importante de la app):
  `font-black tabular-nums`, tamaño grande (`text-3xl` o más) donde sean el
  dato principal de la pantalla (logger de series, PRs).

## Forma y espacio

- **Radios:** `rounded-2xl` (16px) en cards/superficies, `rounded-xl` (12px)
  en controles (botones, inputs, selects) — un toque más angular que un
  radio suave, para que se sienta "sport" y no "spa".
- **Profundidad:** plano por defecto, separación con borde `border`. Sombra
  (`shadow-md`) reservada para lo que necesita destacarse activamente: la
  sesión de entrenamiento en curso, el CTA principal del día.
- **Espacio:** grilla de 8px. La app es mobile-first casi exclusivo (se usa
  parado, con el celular en la mano): contenedores `max-w-sm` (auth) /
  `max-w-md` (resto de la app), sin layouts de escritorio dedicados por
  ahora.
- **Targets táctiles:** mínimo 44px de alto en todo elemento interactivo
  (botones, inputs, selects, filas de lista tocables) — se usa entre series,
  a menudo sin mirar con precisión.
- **Foco accesible:** `focus-visible:ring-2 ring-accent`.

## Lenguaje de datos

- El **peso/serie que estás registrando ahora** va en `accent` — es lo único
  que importa en ese instante.
- **"La última vez"** (referencia histórica del mismo ejercicio) va en
  `muted` — visible pero claramente secundario, para comparar sin competir
  visualmente con el dato actual.
- Prescripción de la rutina (series/reps objetivo) en `foreground` normal:
  es información de referencia, ni protagonista ni secundaria.

## Tema

Automático: sigue `prefers-color-scheme` del sistema. Ambos modos comparten
el mismo acento; solo cambian los neutros (ver tabla de paleta).
