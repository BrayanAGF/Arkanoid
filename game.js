// Arkanoid — MVP jugable (spec 01)

// Constantes de juego
const ANCHO = 480;
const ALTO = 640;
const DT_MAX = 1 / 30; // límite del delta en segundos
const COLORES_FILAS = [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green', 'gray' ];

// Cuadrícula de ladrillos: 7 filas × 10 columnas de 40×20, desde (40, 80)
const COLUMNAS = 10;
const LADRILLO_W = 40;
const LADRILLO_H = 20;
const REJILLA_X = 40;
const REJILLA_Y = 80;

// 70 ladrillos: { x, y, w, h, color, vivo }
const ladrillos = [];

function crearLadrillos() {
  ladrillos.length = 0;
  COLORES_FILAS.forEach( ( color, fila ) => {
    for ( let col = 0; col < COLUMNAS; col++ ) {
      ladrillos.push( {
        x: REJILLA_X + col * LADRILLO_W,
        y: REJILLA_Y + fila * LADRILLO_H,
        w: LADRILLO_W,
        h: LADRILLO_H,
        color,
        vivo: true,
      } );
    }
  } );
}

const canvas = document.getElementById( 'juego' );
const ctx = canvas.getContext( '2d' );

let ultimoTiempo = 0;

function actualizar( dt ) {
  // Se completa en los siguientes pasos.
}

function dibujar() {
  ctx.clearRect( 0, 0, ANCHO, ALTO );

  for ( const l of ladrillos ) {
    if ( l.vivo ) drawSprite( ctx, 'block_' + l.color, l.x, l.y, l.w, l.h );
  }
}

function bucle( ahora ) {
  // Delta en segundos, limitado para evitar saltos tras un parón
  const dt = Math.min( ( ahora - ultimoTiempo ) / 1000, DT_MAX );
  ultimoTiempo = ahora;

  actualizar( dt );
  dibujar();

  requestAnimationFrame( bucle );
}

crearLadrillos();

loadSpritesheet( () => {
  ultimoTiempo = performance.now();
  requestAnimationFrame( bucle );
} );
