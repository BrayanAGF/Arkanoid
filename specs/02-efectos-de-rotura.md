# SPEC 02 — Efectos de rotura de ladrillos

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-09
> **Objetivo:** Que romper un ladrillo se vea con una explosión más visible y con partículas y una breve sacudida de pantalla, todo congelado en pausa.

## Por qué existe esta spec

La destrucción con animación ya está implementada en la SPEC 01 (paso 10). Esta spec la pule y le añade efectos. Los problemas actuales son estos:

- La explosión dura 150 ms y apenas se ve.
- La explosión usa `performance.now()`, así que sigue avanzando con el juego en pausa.
- `EXPLOSION_FRAMES.gray` apunta a los frames rojos, así que el ladrillo gris explota en rojo.

## Alcance

**Entra:**

- La explosión dura 320 ms en total (80 ms por frame).
- Las explosiones, las partículas y la sacudida avanzan con el `dt` del juego en lugar de con el reloj real.
- Los efectos se congelan solo en la fase `pausa`. En `saque`, `jugando`, `derrota` y `victoria` siguen animándose hasta terminar.
- Reiniciar la partida vacía todos los efectos en curso.
- La explosión del ladrillo gris se dibuja con los frames rojos y `ctx.filter = 'grayscale(1)'`.
- Cada ladrillo roto lanza 8 partículas cuadradas de 3×3 px del color del ladrillo, con gravedad y desvanecimiento en 500 ms.
- Cada ladrillo roto inicia una sacudida del mundo de hasta 3 px que se reduce hasta 0 en 120 ms. El HUD y los mensajes no tiemblan.
- Todos los cambios están en `game.js`.

**Fuera de alcance (para specs futuras):**

- Puntos flotantes "+10".
- Ladrillos de varios golpes o con estado intermedio de daño.
- Modificar `assets/spritesheet.js` o `EXPLOSION_DURATION`.
- Opción para desactivar la sacudida o los efectos.
- Efectos al perder una vida o en los rebotes.

## Modelo de datos

Constantes nuevas en `game.js`:

```js
const DURACION_EXPLOSION = 0.32;   // s, total de los 4 frames
const PARTICULAS_POR_LADRILLO = 8;
const TAM_PARTICULA = 3;           // px
const VEL_PARTICULA_MIN = 60;      // px/s
const VEL_PARTICULA_MAX = 180;     // px/s
const GRAVEDAD_PARTICULA = 600;    // px/s²
const VIDA_PARTICULA = 0.5;        // s
const SACUDIDA_MAX = 3;            // px
const DURACION_SACUDIDA = 0.12;    // s
```

Estructuras que cambian o aparecen:

```js
// Cambia: `inicio` (ms de performance.now) pasa a `t` (segundos de juego transcurridos)
const explosiones = [ /* { x, y, w, h, color, t } */ ];

// Nuevo: partículas en curso
const particulas = [ /* { x, y, vx, vy, color, t } */ ];

// Nuevo: sacudida en curso. `t` es el tiempo restante; dx/dy es el desplazamiento del frame actual
const sacudida = { t: 0, dx: 0, dy: 0 };
```

Convenciones:

- `color` de las partículas es el mismo nombre que `l.color` (`'red'`, `'hotpink'`…). Todos son colores CSS válidos y se usan directamente en `ctx.fillStyle`.
- La opacidad de una partícula es `1 - t / VIDA_PARTICULA` y se aplica con `ctx.globalAlpha`.
- `dx`/`dy` solo se recalculan al avanzar los efectos. En pausa, la imagen queda quieta y no sigue temblando.

## Plan de implementación

1. **Explosiones con tiempo de juego.** Añadir `DURACION_EXPLOSION` y la función `actualizarEfectos( dt )`. Esa función suma `dt` al `t` de cada explosión y elimina las que llegan a `t >= DURACION_EXPLOSION`. `bucle` la llama en todas las fases menos en `pausa`, de forma independiente de `actualizar`, que sale antes de tiempo en `derrota` y `victoria`. `chocarLadrillos` crea las explosiones con `t: 0`. `dibujarExplosiones` usa el frame `Math.floor( t / ( DURACION_EXPLOSION / 4 ) )` y ya no elimina explosiones. `reiniciarPartida` vacía `explosiones`. Prueba: la explosión se ve claramente y se queda quieta al pausar.
2. **Gris en gris.** En `dibujarExplosiones`, si `ex.color === 'gray'`, se pone `ctx.filter = 'grayscale(1)'` antes de `drawFrame` y se vuelve a `'none'` después. Prueba: un ladrillo gris explota en gris.
3. **Partículas.** Añadir las constantes y `particulas`. `chocarLadrillos` crea `PARTICULAS_POR_LADRILLO` partículas en el centro del ladrillo, con ángulo aleatorio en [0, 2π) y velocidad aleatoria en [`VEL_PARTICULA_MIN`, `VEL_PARTICULA_MAX`]. En `actualizarEfectos`, cada partícula suma `GRAVEDAD_PARTICULA * dt` a `vy`, se mueve y se elimina al llegar a `t >= VIDA_PARTICULA`. La nueva `dibujarParticulas` se llama después de `dibujarExplosiones` y dibuja con `fillRect` y `globalAlpha`, restaurando `globalAlpha = 1` al terminar. `reiniciarPartida` vacía `particulas`. Prueba: salen 8 cuadraditos del color del ladrillo que caen y se desvanecen.
4. **Sacudida.** Añadir las constantes y `sacudida`. `chocarLadrillos` pone `sacudida.t = DURACION_SACUDIDA`, de modo que reinicia la sacudida y no la acumula. Mientras `sacudida.t > 0`, `actualizarEfectos` resta `dt` y recalcula `dx`/`dy`. Son valores aleatorios en [-A, A], con `A = SACUDIDA_MAX * sacudida.t / DURACION_SACUDIDA`. Al llegar a 0, `dx = dy = 0`. En `dibujar`, los ladrillos, explosiones, partículas, pala y bola se dibujan entre `ctx.save()`, `ctx.translate( sacudida.dx, sacudida.dy )` y `ctx.restore()`. `dibujarHud` y `dibujarMensaje` van fuera. `reiniciarPartida` pone `sacudida.t = 0` y `dx = dy = 0`. Prueba: cada rotura hace temblar el campo de juego, pero no el HUD.

## Criterios de aceptación

- [ ] Servida con `python -m http.server`, la página carga sin errores en la consola.
- [ ] Al romper un ladrillo se ven los 4 frames de explosión durante unos 320 ms.
- [ ] El ladrillo gris explota con frames en escala de grises, no en rojo.
- [ ] Al romper un ladrillo salen 8 cuadrados de 3×3 px del color del ladrillo. Caen por la gravedad y desaparecen desvaneciéndose en unos 500 ms.
- [ ] Al romper un ladrillo, los ladrillos, la pala y la bola tiemblan brevemente (≤ 3 px, unos 120 ms).
- [ ] El HUD (puntos y vidas) y los textos de estado no tiemblan nunca.
- [ ] Si se pausa justo después de romper un ladrillo, la explosión y las partículas se quedan quietas y la pantalla no tiembla. Al reanudar continúan desde donde estaban.
- [ ] Al romper el último ladrillo, su explosión y sus partículas terminan de animarse con "¡VICTORIA!" en pantalla.
- [ ] Al reiniciar con Espacio tras "GAME OVER" o "¡VICTORIA!" no queda ningún efecto en pantalla.
- [ ] Romper varios ladrillos seguidos no acumula la sacudida: el desplazamiento nunca supera 3 px.
- [ ] Los efectos tardan lo mismo en monitores de 60 Hz y de 144 Hz.
- [ ] La puntuación, el sonido y las colisiones se comportan igual que en la SPEC 01.
- [ ] `assets/spritesheet.js` no ha cambiado.
- [ ] `npx eslint@9 .` no reporta errores.

## Decisiones

- **Sí:** los efectos avanzan con el `dt` del juego. Así se congelan en pausa y no dependen del monitor.
- **No:** seguir con `performance.now()`. Las explosiones desaparecían en pausa.
- **Sí:** congelar solo en `pausa`. Los efectos del último ladrillo terminan su animación en `victoria` y `derrota`.
- **No:** congelar también en `victoria`/`derrota`. La explosión del último ladrillo quedaría fija debajo del mensaje.
- **Sí:** `DURACION_EXPLOSION = 0.32` propia de `game.js`. La SPEC 01 decidió no tocar `spritesheet.js`, así que `EXPLOSION_DURATION` deja de usarse.
- **Sí:** `ctx.filter = 'grayscale(1)'` sobre los frames rojos para el gris. Es nativo del canvas y no recorta sprites a mano.
- **No:** corregir `EXPLOSION_FRAMES.gray` en `spritesheet.js`. No está comprobado que el PNG tenga frames grises.
- **Sí:** partículas con `fillRect` del color del ladrillo. No hay sprites de partículas en el spritesheet.
- **Sí:** la sacudida se reinicia con cada rotura en lugar de sumarse. Evita temblores enormes con roturas seguidas.
- **Sí:** el HUD y los mensajes quedan fuera de la sacudida. Así se leen siempre bien.
- **Sí:** `dx`/`dy` se guardan en `sacudida` y solo cambian al avanzar los efectos. Si se calcularan al dibujar, la pantalla seguiría temblando en pausa.
- **No:** puntos flotantes "+10". Se valoraron, pero el usuario los descartó.
- **No:** ladrillos de varios golpes. Es otra funcionalidad y merece su propia spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `ctx.filter` no es compatible con algunos navegadores antiguos (p. ej. Safari anterior a la versión 18) | Si no se admite, la asignación se ignora y el gris explota en rojo, como ahora. No rompe nada. |
| Un `ctx.filter` o `globalAlpha` que no se restaura tiñe o vuelve transparente el resto del frame | Restaurar siempre `filter = 'none'` y `globalAlpha = 1` justo después de dibujar. Comprobarlo visualmente con la pala y la bola. |
| Muchas roturas seguidas acumulan partículas | Como mucho unas 8 por ladrillo durante 0,5 s. Con la velocidad de la bola, eso son unas pocas decenas: coste despreciable. |
| Con la traslación quedan bordes de 3 px sin pintar | Antes de trasladar se limpia el canvas entero, y el fondo lo da el CSS. El borde no se nota con un desplazamiento tan pequeño. |

## Lo que **no** está en esta spec

- Puntos flotantes "+10".
- Ladrillos de varios golpes o con daño visible.
- Cambios en `assets/spritesheet.js`.
- Opciones para desactivar efectos.
- Efectos en otros eventos (perder vida, rebotes).

Cada una de estas, si llega, va en su propia spec.
