// Arkanoid — MVP jugable (spec 01)

// Constantes de juego
const ANCHO = 480;
const ALTO = 640;
const DT_MAX = 1 / 30; // límite del delta en segundos

const canvas = document.getElementById( 'juego' );
const ctx = canvas.getContext( '2d' );

let ultimoTiempo = 0;

function actualizar( dt ) {
  // Se completa en los siguientes pasos.
}

function dibujar() {
  ctx.clearRect( 0, 0, ANCHO, ALTO );
}

function bucle( ahora ) {
  // Delta en segundos, limitado para evitar saltos tras un parón
  const dt = Math.min( ( ahora - ultimoTiempo ) / 1000, DT_MAX );
  ultimoTiempo = ahora;

  actualizar( dt );
  dibujar();

  requestAnimationFrame( bucle );
}

loadSpritesheet( () => {
  ultimoTiempo = performance.now();
  requestAnimationFrame( bucle );
} );
