# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

- Responde siempre en español.
- Todo en español: texto del juego, comentarios, specs y mensajes de commit.

## Proyecto

Juego tipo Arkanoid en HTML, CSS y JavaScript puro. **Cero dependencias**: nada de npm, bundlers, frameworks ni librerías externas.

- Ejecutar con un servidor estático local desde la raíz del repo (p. ej. `python -m http.server`), no abriendo el archivo con `file://`.
- El `index.html` debe vivir en la raíz: `assets/spritesheet.js` carga `assets/spritesheet-breakout.png` con una ruta relativa a la página.
- Usar `<script>` clásicos que comparten variables globales (como `assets/spritesheet.js`), no ES modules. El orden de los `<script>` importa.
- Dibujar con las funciones existentes `loadSpritesheet`, `drawSprite` y `drawFrame` y con los datos de `SPRITES` / `EXPLOSION_FRAMES`; no recortar sprites a mano. Los sonidos están en `assets/sounds/`.

## Estilo de código

Seguir el estilo de `assets/spritesheet.js`: 2 espacios, comillas simples, punto y coma y espacios dentro de paréntesis y corchetes (`fn( a, b )`, `obj[ key ]`).

Lint: `npx eslint@9 .` (fijado a v9 porque las reglas de estilo se quitan en versiones nuevas). No hay `package.json` y no hay que crearlo.

## Flujo de trabajo

- Se trabaja por specs: `/spec` crea la spec en `specs/` y `/spec-impl NN-nombre` la implementa (solo si su estado es Aprobado). No implementes funcionalidades grandes sin una spec aprobada.
- Nunca hagas commits automáticos; el usuario decide cuándo hacer commit.
- Esta carpeta todavía **no es un repositorio git**. `/spec-impl` crea ramas, así que antes hay que ejecutar `git init`. Pregunta antes de hacerlo.
