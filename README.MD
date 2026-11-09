# Arkanoid

Juego tipo Arkanoid hecho con HTML, CSS y JavaScript puro, sin dependencias: nada de npm, bundlers, frameworks ni librerías externas. Se juega en el navegador.

## Cómo jugar

Hay que servir el proyecto con un servidor estático desde la raíz del repositorio. No funciona abriendo `index.html` con `file://`.

```bash
python -m http.server
```

Después abre <http://localhost:8000> en el navegador.

### Controles

| Tecla | Acción |
| --- | --- |
| `←` `→` o `A` `D` | Mover la pala |
| `Espacio` | Empezar, lanzar la bola y reiniciar tras ganar o perder |
| Clic en el canvas | Lanzar la bola |
| `P` o `Esc` | Pausar y reanudar |

### Reglas

- Empiezas con 3 vidas. Pierdes una cada vez que la bola cae por abajo.
- Cada ladrillo roto suma 10 puntos.
- Cada partida carga al azar uno de 5 niveles diseñados a mano.
- Los muros grises son indestructibles y hacen de obstáculo.
- Ganas al romper todos los ladrillos rompibles. Pierdes al quedarte sin vidas.

## Funcionalidades

- Pala, bola, ladrillos, puntuación, vidas y pausa.
- Sonidos de rebote y de rotura.
- Explosiones animadas, partículas y una breve sacudida de pantalla al romper ladrillos.
- Niveles aleatorios con muros indestructibles.

## Estructura

```
index.html              Canvas de 480×640 y carga de scripts (el orden importa)
style.css               Estilos de la página
levels.js               Datos de los niveles (LEYENDA y NIVELES)
game.js                 Lógica del juego: estado, física, colisiones, efectos, dibujo y bucle
assets/spritesheet.js   Carga del spritesheet y funciones de dibujo
assets/sounds/          Efectos de sonido
specs/                  Specs del proyecto
.claude/skills/         Skills /spec y /spec-impl
```

## Desarrollo

El proyecto sigue un flujo **spec-driven**: cada funcionalidad se define antes en una spec de `specs/` y se implementa después.

1. `/spec <descripción>` crea una spec en estado `Borrador`.
2. Se revisa y se cambia a mano el estado a `Aprobado`.
3. `/spec-impl NN-slug` crea la rama `spec-NN-slug` e implementa el plan paso a paso.
4. Se verifican los criterios de aceptación y el estado pasa a `Implementado`.

| Spec | Descripción | Estado |
| --- | --- | --- |
| [01](specs/01-mvp-jugable.md) | MVP jugable de Arkanoid | Implementado |
| [02](specs/02-efectos-de-rotura.md) | Efectos de rotura de ladrillos | Implementado |
| [03](specs/03-niveles-con-muros.md) | Niveles aleatorios con muros indestructibles | Implementado |

### Estilo y lint

El estilo es de 2 espacios, comillas simples, punto y coma y espacios dentro de paréntesis y corchetes (`fn( a, b )`). Para pasar el lint:

```bash
npx eslint@9 .
```
