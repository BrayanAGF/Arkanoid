# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

- Responde siempre en español.
- Todo en español: texto del juego, identificadores, comentarios, specs y mensajes de commit.

## Proyecto

Juego tipo Arkanoid en HTML, CSS y JavaScript puro. **Cero dependencias**: nada de npm, bundlers, frameworks ni librerías externas.

- Ejecutar con un servidor estático local desde la raíz del repo (p. ej. `python -m http.server`), no abriendo el archivo con `file://`.
- El `index.html` debe vivir en la raíz: `assets/spritesheet.js` carga `assets/spritesheet-breakout.png` con una ruta relativa a la página.
- Usar `<script>` clásicos que comparten variables globales, no ES modules. El orden de los `<script>` importa.
- Dibujar con las funciones existentes `loadSpritesheet`, `drawSprite` y `drawFrame` y con los datos de `SPRITES` / `EXPLOSION_FRAMES`; no recortar sprites a mano. Los sonidos están en `assets/sounds/`.

## Estructura

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Canvas `#juego` de 480×640 y carga de scripts en orden: `assets/spritesheet.js` → `levels.js` → `game.js`. |
| `assets/spritesheet.js` | Carga del spritesheet y funciones de dibujo (`SPRITES`, `EXPLOSION_FRAMES`, `drawSprite`, `drawFrame`). No se modifica. |
| `levels.js` | Datos de niveles: `LEYENDA` (carácter → color, `#` muro indestructible, `.` vacío) y `NIVELES` (filas de 10 caracteres, máximo 12 filas). Solo datos, sin lógica. |
| `game.js` | Todo el juego: constantes, estado, entrada, física, colisiones, efectos (explosiones, partículas, sacudida), dibujo y bucle. |
| `style.css` | Estilos de la página. |
| `specs/` | Specs numeradas (`NN-slug.md`) y `.spec-config.yml`. |
| `.claude/skills/` | Skills `spec` (con `template.md`) y `spec-impl`. |

Convenciones de `game.js`:

- Constantes en `MAYUSCULAS` al principio, con unidades en comentario (`px/s`, `s`, `px`). Indicar la spec que las introdujo cuando aplique (`// (spec 03)`).
- El estado de la partida vive en `estado.fase`: `'inicio' | 'saque' | 'jugando' | 'pausa' | 'derrota' | 'victoria'`. Los efectos se congelan en pausa.
- La física usa delta de tiempo en segundos, limitado por `DT_MAX`.

## Estilo de código

Seguir el estilo de `assets/spritesheet.js`: 2 espacios, comillas simples, punto y coma y espacios dentro de paréntesis y corchetes (`fn( a, b )`, `obj[ key ]`).

Lint: `npx eslint@9 .` (fijado a v9 porque las reglas de estilo se quitan en versiones nuevas). No hay `package.json` y no hay que crearlo.

## Flujo spec-driven

Toda funcionalidad grande pasa por una spec aprobada. No implementes nada grande sin ella.

1. **`/spec <descripción>`** — diseña la spec por preguntas y la guarda en `specs/NN-slug.md` con estado `Borrador`. No escribe código.
2. **El usuario** la revisa y cambia el estado a `Aprobado` a mano. El agente nunca aprueba una spec.
3. **`/spec-impl NN-slug`** — solo si el estado es `Aprobado`. Crea la rama `spec-NN-slug` (según `AutoCreateBranch` en `specs/.spec-config.yml`) e implementa el plan paso a paso, parando tras cada paso para revisar el diff.
4. **Cierre** — se verifican los criterios de aceptación y se pasa el estado a `Implementado`.

Formato de las specs (ver `.claude/skills/spec/template.md`; las specs existentes son la referencia):

- Cabecera en blockquote: `**Estado:**`, `**Depende de:**`, `**Fecha:**`, `**Objetivo:**` (una sola frase).
- Estados válidos: `Borrador`, `En revisión`, `Aprobado`, `Implementado`, `Obsoleto`.
- Secciones en este orden: `## Por qué existe esta spec` (opcional), `## Alcance` (con **Entra:** y **Fuera de alcance (para specs futuras):**), `## Modelo de datos`, `## Plan de implementación`, `## Criterios de aceptación`, `## Decisiones`, `## Riesgos` (opcional), `## Lo que **no** está en esta spec`.
- Numeración secuencial de dos dígitos y slug en kebab-case en español.

Reglas durante la implementación:

- Implementar lo que dice la spec. Si algo parece mejorable, se comenta como observación y el cambio va a la spec, no al código por sorpresa.
- Ante una ambigüedad que la spec no resuelve: parar, dar 2–3 opciones y esperar decisión.
- Lo que esté fuera del alcance de la spec no se implementa en su rama; se anota para una spec futura.

## Git

- Nunca hagas commits automáticos; el usuario decide cuándo hacer commit.
- Cada spec se trabaja en su rama `spec-NN-slug` y se integra en `main`.
