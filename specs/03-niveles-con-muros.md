# SPEC 03 — Niveles aleatorios con muros indestructibles

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-09
> **Objetivo:** Que cada partida nueva cargue al azar uno de 5 niveles diseñados a mano, con muros de bloques indestructibles que hacen de obstáculo para llegar a los ladrillos rompibles.

## Por qué existe esta spec

Hoy hay un único nivel fijo de 7 × 10 ladrillos, generado por código en `crearLadrillos()` a partir de `COLORES_FILAS`. Todas las partidas son iguales. Esta spec convierte el nivel en datos, añade cuatro niveles más y un tipo de bloque que no se rompe. Los muros obligan a buscar huecos y ángulos para llegar a los ladrillos.

## Alcance

**Entra:**

- Archivo nuevo `levels.js` en la raíz con los mapas de los 5 niveles y la leyenda de caracteres.
- `index.html` carga `levels.js` entre `assets/spritesheet.js` y `game.js`.
- Cada nivel es un mapa de texto de 10 columnas y hasta 12 filas, con celdas de 40×20 desde (40, 80), como ahora.
- Bloque indestructible (`#`) dibujado con el sprite `block_gray`. El gris deja de usarse como ladrillo rompible.
- Al golpear un muro, la bola rebota igual que en un ladrillo, suena `ball-bounce.mp3` y salen 4 chispas grises desde el centro de la bola. No hay explosión, ni sacudida, ni puntos.
- La victoria se alcanza al romper todos los ladrillos rompibles. Los muros no cuentan.
- Al cargar la página se elige un nivel al azar.
- Cada `reiniciarPartida()` (tras "GAME OVER" o "¡VICTORIA!") elige un nivel al azar distinto del anterior.
- El HUD muestra "Nivel N" centrado en la franja superior, donde N es la posición del nivel en `NIVELES` empezando en 1.
- Puntos (10 por ladrillo), vidas, velocidades y efectos de la SPEC 02 no cambian.

**Fuera de alcance (para specs futuras):**

- Progresión de niveles (pasar al siguiente al ganar conservando puntos y vidas).
- Ladrillos de varios golpes.
- Lógica anti-bucle en el juego (desvío automático de la bola).
- Editor de niveles o niveles cargados desde archivos JSON.
- Récords o persistencia del nivel jugado.
- Nombres de nivel en el HUD.

## Modelo de datos

Nuevo archivo `levels.js` (script clásico, globales compartidas):

```js
// Carácter → color del ladrillo. '#' es el muro indestructible; '.' es una celda vacía.
const LEYENDA = { R: 'red', Y: 'yellow', C: 'cyan', M: 'magenta', P: 'hotpink', G: 'green', '#': 'gray' };

// Cada nivel: array de filas, 10 caracteres por fila, 12 filas como máximo
const NIVELES = [
  [ /* 'RRRRRRRRRR', 'YYYYYYYYYY', ... */ ],
  // ...
];
```

Cambios en `game.js`:

```js
const FILAS_MAX = 12;
const CHISPAS_MURO = 4;

// Se elimina COLORES_FILAS.

// Cambia: cada ladrillo gana `indestructible`
const ladrillos = [ /* { x, y, w, h, color, vivo, indestructible } */ ];

// Nuevo: índice en NIVELES del nivel en juego. -1 antes de elegir el primero.
let nivelActual = -1;
```

Los 5 niveles (`.` vacío, `#` muro):

```text
Nivel 1 — 60 ladrillos     Nivel 2 — 40 ladrillos     Nivel 3 — 35 ladrillos
RRRRRRRRRR                 RRRRRRRRRR                 RR#YY#CC#M
YYYYYYYYYY                 YYYYYYYYYY                 RR#YY#CC#M
CCCCCCCCCC                 CCCCCCCCCC                 RR#YY#CC#M
MMMMMMMMMM                 MMMMMMMMMM                 RR#YY#CC#M
PPPPPPPPPP                 ..........                 PP.GG.PP.G
GGGGGGGGGG                 ###.##.###

Nivel 4 — 32 ladrillos     Nivel 5 — 40 ladrillos
YYYYYYYYYY                 RRRRRRRRRR
.########.                 ####......
.#MMMMMM#.                 YYYYYYYYYY
.#PPPPPP#.                 ......####
.#GGGGGG#.                 CCCCCCCCCC
.###..###.                 ####......
..........                 MMMMMMMMMM
CC......CC
```

Convenciones:

- La fila `i` del mapa está en `y = REJILLA_Y + i * LADRILLO_H`. La columna `j`, en `x = REJILLA_X + j * LADRILLO_W`.
- Los muros se crean con `vivo: true` y `indestructible: true`, y nunca pasan a `vivo: false`.
- Un carácter que no está en `LEYENDA` ni es `.` se trata como celda vacía y se avisa con `console.warn`.

## Plan de implementación

1. **Nivel desde datos.** Crear `levels.js` con `LEYENDA` y `NIVELES`, que de momento solo contiene el nivel 1. Añadir su `<script>` en `index.html` entre `assets/spritesheet.js` y `game.js`. `crearLadrillos( mapa )` recorre el mapa y crea un ladrillo por cada carácter de `LEYENDA`, con `indestructible: false`. Se elimina `COLORES_FILAS`. Caracteres desconocidos: `console.warn` y celda vacía. Prueba: se ven 60 ladrillos en 6 filas de colores y la partida se gana con 600 puntos.
2. **Muros indestructibles.** `crearLadrillos` marca `#` con `indestructible: true`. En `chocarLadrillos`, el rebote y el empuje de la bola se hacen igual para todos los bloques. Si el bloque es indestructible, sigue vivo, suena `sonidoRebote` y no hay puntos, explosión ni sacudida. `comprobarFinDeBola` declara victoria cuando no queda ningún ladrillo con `vivo && !indestructible`. Añadir el nivel 2 a `NIVELES` y cargarlo a mano para probar. Prueba: la bola rebota en la barrera, que nunca desaparece, y la partida se gana con 400 puntos.
3. **Chispas.** `crearParticulas` pasa a recibir `( cx, cy, color, cantidad )`. La rotura de ladrillo la llama con el centro del ladrillo, su color y `PARTICULAS_POR_LADRILLO`. El golpe a un muro la llama con el centro de la bola, `'gray'` y `CHISPAS_MURO`. Prueba: al golpear un muro salen 4 cuadraditos grises. Al romper un ladrillo, siguen saliendo 8 de su color.
4. **Selección aleatoria y HUD.** Añadir `nivelActual` y `elegirNivel()`. Esa función escoge un índice al azar de `NIVELES` distinto de `nivelActual` (si hay más de uno), lo guarda y llama a `crearLadrillos( NIVELES[ nivelActual ] )`. Se llama al cargar la página, en lugar del `crearLadrillos()` actual, y desde `reiniciarPartida()`. `dibujarHud` dibuja "Nivel " + ( `nivelActual` + 1 ) centrado en `ALTO_HUD / 2`. Prueba: recargar o reiniciar varias veces muestra niveles distintos y nunca repite el anterior al reiniciar.
5. **Niveles 3, 4 y 5.** Añadir los tres mapas restantes a `NIVELES`, tal como aparecen en el modelo de datos. Prueba: jugar cada uno hasta la victoria y comprobar que ningún ladrillo queda inalcanzable y que la bola no se queda atrapada en un bucle.

## Criterios de aceptación

- [ ] Servida con `python -m http.server`, la página carga sin errores en la consola.
- [ ] `index.html` carga, en este orden, `assets/spritesheet.js`, `levels.js` y `game.js`.
- [ ] `NIVELES` contiene exactamente 5 niveles, con los mapas de esta spec.
- [ ] Al cargar la página se ve uno de los 5 niveles y el HUD muestra "Nivel N" con su número correcto.
- [ ] Tras "GAME OVER" o "¡VICTORIA!", Espacio carga un nivel distinto del que se acaba de jugar, con 0 puntos y 3 vidas.
- [ ] Los muros se dibujan con el sprite gris. Ningún ladrillo rompible es gris.
- [ ] Al golpear un muro, la bola rebota, suena `ball-bounce.mp3` y salen 4 chispas grises. El muro no desaparece y los puntos no cambian.
- [ ] Golpear un muro no produce explosión ni sacudida.
- [ ] Romper un ladrillo rompible sigue sumando 10 puntos, con explosión, 8 partículas, sacudida y `break-sound.mp3`.
- [ ] "¡VICTORIA!" aparece al romper el último ladrillo rompible, aunque queden muros. Los puntos finales son 600, 400, 350, 320 y 400 en los niveles 1 a 5.
- [ ] En cada uno de los 5 niveles se puede romper todos los ladrillos rompibles en una partida de prueba.
- [ ] Un carácter desconocido en un mapa produce un `console.warn` y no rompe el juego.
- [ ] `assets/spritesheet.js` no ha cambiado.
- [ ] `npx eslint@9 .` no reporta errores.
- [ ] No hay `package.json` ni dependencias externas.

## Decisiones

- **Sí:** nivel aleatorio en cada partida nueva, distinto del anterior. Es lo que pidió el usuario y evita repetir el mismo nivel dos veces seguidas.
- **No:** progresión de niveles conservando puntos y vidas. Añade reglas de campaña y queda para otra spec.
- **Sí:** 5 niveles diseñados a mano. Hay variedad suficiente para que el azar se note sin alargar el diseño y las pruebas.
- **Sí:** el nivel 1 es el nivel actual sin la fila gris. Conserva la partida clásica como uno de los niveles.
- **Sí:** el sprite gris pasa a ser el muro indestructible. Se distingue a simple vista sin filtros de dibujo.
- **No:** gris oscurecido con `ctx.filter` para los muros. Los muros y los ladrillos grises se confundirían.
- **Sí:** mapas de texto en `levels.js`. Separa el diseño de los niveles de la lógica, y un mapa de texto se lee y se edita de un vistazo.
- **No:** niveles dentro de `game.js` o en archivos JSON. El primero hace crecer `game.js`. El segundo necesita `fetch` y manejo de errores asíncronos.
- **Sí:** muros en el mismo array `ladrillos` con `indestructible: true`. La colisión, el empuje y el dibujo se reutilizan sin duplicar código.
- **Sí:** rebote, sonido de rebote y 4 chispas grises al golpear un muro. Da respuesta visual sin confundirse con una rotura.
- **No:** explosión o sacudida al golpear un muro. Se reservan para las roturas.
- **Sí:** "Nivel N" en el HUD. Basta para saber qué nivel se juega.
- **No:** nombres de nivel en el HUD. El usuario prefirió solo el número.
- **Sí:** cuadrícula de 10 columnas × hasta 12 filas con el origen actual. Mantiene la geometría de la SPEC 01 y deja 280 px libres sobre la pala.
- **Sí:** evitar bucles de la bola con el diseño de los niveles y pruebas manuales. No añade lógica al juego.
- **No:** desvío automático de la bola tras muchos golpes a muros. Más código para un problema que el diseño evita.
- **Sí:** el criterio de la SPEC 01 de "70 ladrillos y 700 puntos" deja de aplicarse. Lo sustituyen los recuentos por nivel de esta spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La bola queda atrapada rebotando entre muros sin tocar ladrillos ni la pala | Los mapas no tienen cavidades cerradas y todos los huecos miden al menos 40 px. Cada nivel se juega hasta la victoria en el paso 5. |
| Al empujar la bola fuera de un muro entra en el muro vecino | Es el mismo comportamiento que con ladrillos vecinos en la SPEC 01: en el frame siguiente se detecta la nueva colisión y se vuelve a empujar. |
| Un ladrillo queda inalcanzable y la partida no se puede ganar | Todos los ladrillos tienen un camino libre desde abajo o desde un lateral. Se comprueba al jugar cada nivel. |
| `levels.js` se carga después de `game.js` y `NIVELES` no existe | El orden de los `<script>` es un criterio de aceptación. |
| Un mapa mal escrito (carácter erróneo) | `console.warn` y celda vacía, el juego sigue funcionando. |

## Lo que **no** está en esta spec

- Progresión de niveles al ganar.
- Ladrillos de varios golpes.
- Lógica anti-bucle en el juego.
- Editor de niveles o niveles en JSON.
- Récords o persistencia.
- Nombres de nivel.

Cada una de estas, si llega, va en su propia spec.
