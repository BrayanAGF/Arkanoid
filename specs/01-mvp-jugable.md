# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-11-09
> **Objetivo:** Un nivel de Arkanoid jugable en el navegador con pala, bola, ladrillos, puntuación, vidas, pausa, sonidos y explosiones.

## Alcance

**Entra:**

- `index.html` en la raíz con un `<canvas>` de resolución lógica fija 480×640.
- `style.css` que centra el canvas y lo escala manteniendo la proporción.
- `game.js` con todo el juego, cargado después de `assets/spritesheet.js`.
- Bucle con `requestAnimationFrame` y delta time (velocidades en px/segundo).
- Pala controlada con teclado (flechas o A/D) y ratón.
- Bola que sale pegada a la pala y se lanza con Espacio o clic.
- Rebote de la bola en las paredes izquierda, derecha y superior.
- Rebote en la pala con ángulo según el punto de impacto (máximo 60° respecto a la vertical).
- Un único nivel fijo: 7 filas × 10 columnas, una fila por color.
- Todos los ladrillos se rompen de un golpe y valen 10 puntos.
- Marcador de puntos y vidas (3 al empezar) dibujado en el canvas.
- Estados: inicio, saque, jugando, pausa, derrota y victoria.
- Pausa con P o Esc.
- Sonidos `assets/sounds/ball-bounce.mp3` (pala y paredes) y `assets/sounds/break-sound.mp3` (ladrillo).
- Animación de explosión con `EXPLOSION_FRAMES` al romper un ladrillo.

**Fuera de alcance (para specs futuras):**

- Varios niveles o niveles cargados desde datos.
- Récords o cualquier persistencia (localStorage, etc.).
- Power-ups, ladrillos resistentes o indestructibles.
- Aumento progresivo de la velocidad de la bola.
- Controles táctiles o versión móvil.
- Menús, opciones o control de volumen.

## Modelo de datos

Todo vive en globales de `game.js`, sin persistencia.

```js
// Constantes de juego
const ANCHO = 480;
const ALTO = 640;
const VIDAS_INICIALES = 3;
const PUNTOS_LADRILLO = 10;
const VEL_PALA = 480;          // px/s
const VEL_BOLA = 360;          // px/s, constante toda la partida
const ANGULO_MAX = Math.PI / 3; // 60° respecto a la vertical
const DT_MAX = 1 / 30;         // límite del delta en segundos
const COLORES_FILAS = [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green', 'gray' ];

// Estado de la partida
const estado = {
  fase: 'inicio', // 'inicio' | 'saque' | 'jugando' | 'pausa' | 'derrota' | 'victoria'
  puntos: 0,
  vidas: VIDAS_INICIALES,
};

const pala = { x: 192, y: 600, w: 96, h: 14 };
const bola = { x: 0, y: 0, w: 12, h: 12, vx: 0, vy: 0 };

// 70 ladrillos de 40×20, cuadrícula desde (40, 80)
const ladrillos = [ /* { x, y, w: 40, h: 20, color: 'red', vivo: true } */ ];

// Explosiones en curso
const explosiones = [ /* { x, y, w, h, color, inicio } — inicio en ms (performance.now) */ ];

// Entrada
const teclas = { izquierda: false, derecha: false };
```

Convenciones:

- Coordenadas con origen arriba a la izquierda, en unidades lógicas del canvas (480×640).
- `x`, `y` de cada entidad son la esquina superior izquierda.
- Las coordenadas del ratón se convierten a unidades lógicas con `getBoundingClientRect()`.
- Se dibuja solo con `drawSprite( ctx, 'paddle' | 'ball' | 'block_<color>', … )` y `drawFrame( ctx, EXPLOSION_FRAMES[ color ][ i ], … )`.
- El HUD (puntos y vidas) ocupa la franja superior (y < 60) y se dibuja con `ctx.fillText`.

## Plan de implementación

1. Crear `index.html`, `style.css` y `game.js`. El HTML carga `assets/spritesheet.js` y luego `game.js`. `game.js` llama a `loadSpritesheet` y arranca un bucle `requestAnimationFrame` que calcula `dt` (limitado a `DT_MAX`) y limpia el canvas. Prueba manual: `python -m http.server`, la página muestra el canvas centrado sin errores en consola.
2. Generar la cuadrícula `ladrillos` (7 × 10, un color por fila según `COLORES_FILAS`) y dibujarla. Prueba: se ven 7 filas de colores.
3. Pala: listeners `keydown`/`keyup` (flechas y A/D) y `mousemove` sobre el canvas. La pala se mueve a `VEL_PALA` con teclado, sigue al ratón y queda limitada a los bordes. Prueba: se mueve con ambos controles y no sale del canvas.
4. Bola en fase `saque`: se dibuja centrada sobre la pala y la sigue. Espacio o clic la lanza a `VEL_BOLA` con un ángulo fijo de 30° hacia la derecha y pasa a `jugando`.
5. Movimiento y rebotes de la bola: paredes izquierda, derecha y superior. Rebote en la pala solo si `vy > 0`, con ángulo `offset * ANGULO_MAX`, donde `offset` es la posición relativa del impacto en [-1, 1]. Prueba: la bola sale inclinada al golpear los bordes de la pala.
6. Colisión bola–ladrillo (AABB, como máximo un ladrillo por frame). El rebote invierte `vx` o `vy` según el eje de menor solapamiento. El ladrillo pasa a `vivo: false` y suma `PUNTOS_LADRILLO`. Prueba: los ladrillos desaparecen y la puntuación sube de 10 en 10.
7. Vidas y fin de partida: si la bola cae por debajo del canvas, se resta una vida y se vuelve a `saque`. Con 0 vidas la fase pasa a `derrota`. Si no quedan ladrillos vivos, pasa a `victoria`. En `derrota` o `victoria`, Espacio reinicia puntos, vidas y ladrillos y pasa a `saque`.
8. HUD y textos de estado: puntos y vidas arriba. En `inicio` se muestra "Pulsa Espacio para empezar" y Espacio pasa a `saque`. Mensajes "PAUSA", "GAME OVER" y "¡VICTORIA!" con la instrucción para continuar o reiniciar. P o Esc alterna entre `jugando`/`saque` y `pausa`. El juego se congela en pausa.
9. Sonidos: crear los dos `Audio` al cargar. Cada reproducción reinicia `currentTime = 0` y captura el rechazo de `play()`. Rebote en pala o pared → `ball-bounce.mp3`. Ladrillo roto → `break-sound.mp3`.
10. Explosiones: al romper un ladrillo se añade una entrada a `explosiones`. Se dibuja el frame `Math.floor( transcurrido / ( EXPLOSION_DURATION / 4 ) )` y se elimina al superar `EXPLOSION_DURATION`. Prueba: cada ladrillo roto muestra una breve animación.

## Criterios de aceptación

- [ ] Servida con `python -m http.server`, la página carga sin errores en la consola.
- [ ] El canvas se ve centrado y mantiene la proporción 3:4 al redimensionar la ventana.
- [ ] Al cargar se ve el texto "Pulsa Espacio para empezar", la cuadrícula de 70 ladrillos (7 filas de colores distintos), la pala y el HUD con `0` puntos y `3` vidas.
- [ ] Las flechas y A/D mueven la pala, y también la mueve el ratón.
- [ ] La pala nunca sale del canvas.
- [ ] En fase de saque la bola sigue a la pala. Espacio o clic la lanza.
- [ ] La bola rebota en las paredes izquierda, derecha y superior.
- [ ] Golpear el centro de la pala devuelve la bola casi vertical. Golpear un extremo la devuelve con una inclinación clara (cercana a 60°).
- [ ] Romper un ladrillo suma exactamente 10 puntos y lo hace desaparecer.
- [ ] Romper un ladrillo reproduce `break-sound.mp3` y una animación de explosión.
- [ ] Un rebote en pala o pared reproduce `ball-bounce.mp3`.
- [ ] Si la bola cae por abajo se pierde una vida y la bola vuelve a la pala.
- [ ] Al perder la tercera vida se muestra "GAME OVER". Espacio reinicia con 0 puntos, 3 vidas y los 70 ladrillos.
- [ ] Al romper los 70 ladrillos se muestra "¡VICTORIA!" con 700 puntos. Espacio reinicia.
- [ ] P o Esc pausa: la bola y la pala dejan de moverse y se muestra "PAUSA". Otra pulsación reanuda.
- [ ] La velocidad de la bola es la misma en monitores de 60 Hz y de 144 Hz.
- [ ] `npx eslint@9 .` no reporta errores.
- [ ] No hay `package.json` ni dependencias externas.

## Decisiones

- **Sí:** un único `game.js`. Para un MVP es más fácil de leer que varios scripts con orden de carga frágil.
- **No:** dividir en `js/paddle.js`, `js/ball.js`, etc. Se puede refactorizar cuando haya más funcionalidades.
- **Sí:** resolución lógica 480×640 escalada por CSS. La cuadrícula y la física se calculan en unidades fijas.
- **No:** pantalla completa adaptable. Complica el cálculo de la cuadrícula.
- **Sí:** delta time con `requestAnimationFrame` y límite `DT_MAX`. La velocidad no depende del monitor y el límite evita que la bola atraviese objetos tras un parón.
- **No:** velocidades por frame. Irían más rápido en monitores de alta frecuencia.
- **Sí:** ángulo de rebote según el punto de impacto en la pala. Da control al jugador.
- **No:** reflexión simple. Hace las partidas predecibles.
- **Sí:** saque con ángulo fijo de 30° a la derecha. Evita un bucle vertical perfecto al lanzar desde el centro.
- **Sí:** todos los ladrillos valen 10 y se rompen de un golpe. Las variantes (puntos por fila, ladrillos resistentes) quedan para otra spec.
- **Sí:** velocidad de la bola constante. Es más fácil de ajustar y de probar.
- **Sí:** sin persistencia. Los récords quedan para una spec futura.
- **Sí:** `EXPLOSION_DURATION` (150 ms) se interpreta como la duración total de los 4 frames.
- **Sí:** teclado y ratón a la vez. Ambos controles escriben la posición de la misma `pala`.
- **No:** modificar `assets/spritesheet.js`. Se usa tal cual.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El navegador bloquea el audio antes de una interacción (autoplay) | Ningún sonido suena antes del primer Espacio/clic. Se captura el rechazo de `play()` y el juego sigue sin sonido. |
| La bola atraviesa la pala o un ladrillo con un `dt` grande | `DT_MAX = 1/30` limita el desplazamiento a unos 12 px por paso, menos que el alto de la pala (14) y de un ladrillo (20). |
| La bola se queda "pegada" dentro de la pala | El rebote en la pala solo se aplica si `vy > 0`, y la bola se recoloca encima de la pala. |
| `EXPLOSION_FRAMES.gray` apunta a las coordenadas de los frames rojos | Se acepta: el ladrillo gris explota en rojo. No se toca `spritesheet.js` en esta spec. |
| Abrir `index.html` con `file://` falla al cargar el spritesheet | Documentado en `CLAUDE.md`: hay que usar un servidor estático local. |

## Lo que **no** está en esta spec

- Varios niveles.
- Récords o persistencia.
- Power-ups y ladrillos especiales.
- Aumento de velocidad.
- Controles táctiles o versión móvil.
- Menús de opciones o volumen.

Cada una de estas, si llega, va en su propia spec.
