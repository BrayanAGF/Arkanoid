// Niveles del juego (spec 03). Script clásico: se carga entre spritesheet.js y game.js.

// Carácter → color del ladrillo. '#' es el muro indestructible; '.' es una celda vacía.
const LEYENDA = { R: 'red', Y: 'yellow', C: 'cyan', M: 'magenta', P: 'hotpink', G: 'green', '#': 'gray' };

// Cada nivel: array de filas, 10 caracteres por fila, 12 filas como máximo
const NIVELES = [
  // Nivel 1 — 60 ladrillos
  [
    'RRRRRRRRRR',
    'YYYYYYYYYY',
    'CCCCCCCCCC',
    'MMMMMMMMMM',
    'PPPPPPPPPP',
    'GGGGGGGGGG',
  ],
  // Nivel 2 — 40 ladrillos
  [
    'RRRRRRRRRR',
    'YYYYYYYYYY',
    'CCCCCCCCCC',
    'MMMMMMMMMM',
    '..........',
    '###.##.###',
  ],
];
