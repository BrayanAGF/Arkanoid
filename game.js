// Arkanoid — MVP jugable (spec 01)

// Constantes de juego
const ANCHO = 480;
const ALTO = 640;
const DT_MAX = 1 / 30; // límite del delta en segundos
const VIDAS_INICIALES = 3;
const PUNTOS_LADRILLO = 10;
const VEL_PALA = 480; // px/s
const VEL_BOLA = 360; // px/s, constante toda la partida
const ANGULO_SAQUE = Math.PI / 6; // 30° a la derecha respecto a la vertical
const ANGULO_MAX = Math.PI / 3; // 60° respecto a la vertical
const ALTO_HUD = 60; // franja superior del HUD; la pared superior está en su borde
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

// Estado de la partida
const estado = {
  fase: 'inicio', // 'inicio' | 'saque' | 'jugando' | 'pausa' | 'derrota' | 'victoria'
  puntos: 0,
  vidas: VIDAS_INICIALES,
};

const pala = { x: 192, y: 600, w: 96, h: 14 };
const bola = { x: 0, y: 0, w: 12, h: 12, vx: 0, vy: 0 };

// Sonidos
const sonidoRebote = new Audio( 'assets/sounds/ball-bounce.mp3' );
const sonidoRotura = new Audio( 'assets/sounds/break-sound.mp3' );

// Reinicia el sonido y lo reproduce. Si el navegador lo bloquea, el juego sigue sin sonido.
function reproducir( sonido ) {
  sonido.currentTime = 0;
  sonido.play().catch( () => {} );
}

// Fase a la que se vuelve al salir de la pausa ('saque' o 'jugando')
let faseAntesDePausa = 'saque';

// La pala y la bola solo se mueven en estas fases
function faseActiva() {
  return estado.fase === 'saque' || estado.fase === 'jugando';
}

// Entrada
const teclas = { izquierda: false, derecha: false };

const canvas = document.getElementById( 'juego' );
const ctx = canvas.getContext( '2d' );

// Teclas de movimiento: flechas y A/D
const TECLAS_MOVIMIENTO = {
  ArrowLeft: 'izquierda',
  a: 'izquierda',
  A: 'izquierda',
  ArrowRight: 'derecha',
  d: 'derecha',
  D: 'derecha',
};

document.addEventListener( 'keydown', ( e ) => {
  const direccion = TECLAS_MOVIMIENTO[ e.key ];
  if ( direccion ) {
    teclas[ direccion ] = true;
    e.preventDefault();
  }
  if ( e.code === 'Space' ) {
    e.preventDefault();
    if ( !e.repeat ) accionPrincipal();
  }
  if ( ( e.key === 'p' || e.key === 'P' || e.key === 'Escape' ) && !e.repeat ) {
    alternarPausa();
  }
} );

canvas.addEventListener( 'click', () => {
  if ( estado.fase === 'saque' ) lanzarBola();
} );

// Espacio: acción según la fase actual
function accionPrincipal() {
  if ( estado.fase === 'inicio' ) estado.fase = 'saque';
  else if ( estado.fase === 'saque' ) lanzarBola();
  else if ( estado.fase === 'derrota' || estado.fase === 'victoria' ) reiniciarPartida();
}

// P o Esc: 'jugando'/'saque' ↔ 'pausa'
function alternarPausa() {
  if ( faseActiva() ) {
    faseAntesDePausa = estado.fase;
    estado.fase = 'pausa';
  } else if ( estado.fase === 'pausa' ) {
    estado.fase = faseAntesDePausa;
  }
}

function reiniciarPartida() {
  estado.puntos = 0;
  estado.vidas = VIDAS_INICIALES;
  crearLadrillos();
  estado.fase = 'saque';
}

// Bola perdida por abajo o nivel completado
function comprobarFinDeBola() {
  if ( bola.y > ALTO ) {
    estado.vidas--;
    estado.fase = estado.vidas > 0 ? 'saque' : 'derrota';
  } else if ( !ladrillos.some( ( l ) => l.vivo ) ) {
    estado.fase = 'victoria';
  }
}

document.addEventListener( 'keyup', ( e ) => {
  const direccion = TECLAS_MOVIMIENTO[ e.key ];
  if ( direccion ) teclas[ direccion ] = false;
} );

// El ratón centra la pala en su posición, convertida a unidades lógicas
canvas.addEventListener( 'mousemove', ( e ) => {
  if ( !faseActiva() ) return;
  const rect = canvas.getBoundingClientRect();
  const ratonX = ( e.clientX - rect.left ) * ( ANCHO / rect.width );
  pala.x = ratonX - pala.w / 2;
  limitarPala();
} );

function limitarPala() {
  pala.x = Math.max( 0, Math.min( ANCHO - pala.w, pala.x ) );
}

function moverPala( dt ) {
  let direccion = 0;
  if ( teclas.izquierda ) direccion -= 1;
  if ( teclas.derecha ) direccion += 1;
  pala.x += direccion * VEL_PALA * dt;
  limitarPala();
}

// En saque la bola va centrada encima de la pala
function colocarBolaEnPala() {
  bola.x = pala.x + ( pala.w - bola.w ) / 2;
  bola.y = pala.y - bola.h;
}

function lanzarBola() {
  bola.vx = VEL_BOLA * Math.sin( ANGULO_SAQUE );
  bola.vy = -VEL_BOLA * Math.cos( ANGULO_SAQUE );
  estado.fase = 'jugando';
}

function moverBola( dt ) {
  bola.x += bola.vx * dt;
  bola.y += bola.vy * dt;

  // Paredes: se recoloca la bola dentro y se fuerza el sentido de la velocidad
  if ( bola.x < 0 ) {
    bola.x = 0;
    bola.vx = Math.abs( bola.vx );
    reproducir( sonidoRebote );
  } else if ( bola.x + bola.w > ANCHO ) {
    bola.x = ANCHO - bola.w;
    bola.vx = -Math.abs( bola.vx );
    reproducir( sonidoRebote );
  }
  if ( bola.y < ALTO_HUD ) {
    bola.y = ALTO_HUD;
    bola.vy = Math.abs( bola.vy );
    reproducir( sonidoRebote );
  }

  // Pala: solo si la bola baja, con ángulo según el punto de impacto
  if ( bola.vy > 0 && solapan( bola, pala ) ) {
    const centroBola = bola.x + bola.w / 2;
    const centroPala = pala.x + pala.w / 2;
    const offset = Math.max( -1, Math.min( 1, ( centroBola - centroPala ) / ( pala.w / 2 ) ) );
    const angulo = offset * ANGULO_MAX;
    bola.vx = VEL_BOLA * Math.sin( angulo );
    bola.vy = -VEL_BOLA * Math.cos( angulo );
    bola.y = pala.y - bola.h;
    reproducir( sonidoRebote );
  }
}

// Como máximo un ladrillo por frame. El rebote se hace en el eje de menor solapamiento.
function chocarLadrillos() {
  const l = ladrillos.find( ( candidato ) => candidato.vivo && solapan( bola, candidato ) );
  if ( !l ) return;

  const solapeX = Math.min( bola.x + bola.w - l.x, l.x + l.w - bola.x );
  const solapeY = Math.min( bola.y + bola.h - l.y, l.y + l.h - bola.y );
  const bolaALaIzquierda = bola.x + bola.w / 2 < l.x + l.w / 2;
  const bolaArriba = bola.y + bola.h / 2 < l.y + l.h / 2;

  // Se saca la bola del ladrillo para que no golpee al vecino en el frame siguiente
  if ( solapeX < solapeY ) {
    bola.vx = -bola.vx;
    bola.x += bolaALaIzquierda ? -solapeX : solapeX;
  } else {
    bola.vy = -bola.vy;
    bola.y += bolaArriba ? -solapeY : solapeY;
  }

  l.vivo = false;
  estado.puntos += PUNTOS_LADRILLO;
  reproducir( sonidoRotura );
}

// Intersección AABB entre dos rectángulos { x, y, w, h }
function solapan( a, b ) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;
}

let ultimoTiempo = 0;

function actualizar( dt ) {
  if ( !faseActiva() ) return; // congelado en inicio, pausa, derrota y victoria

  moverPala( dt );
  if ( estado.fase === 'saque' ) colocarBolaEnPala();
  else if ( estado.fase === 'jugando' ) {
    moverBola( dt );
    chocarLadrillos();
    comprobarFinDeBola();
  }
}

function dibujar() {
  ctx.clearRect( 0, 0, ANCHO, ALTO );

  for ( const l of ladrillos ) {
    if ( l.vivo ) drawSprite( ctx, 'block_' + l.color, l.x, l.y, l.w, l.h );
  }

  drawSprite( ctx, 'paddle', pala.x, pala.y, pala.w, pala.h );
  drawSprite( ctx, 'ball', bola.x, bola.y, bola.w, bola.h );

  dibujarHud();
  dibujarMensaje();
}

// Puntos y vidas en la franja superior (y < ALTO_HUD)
function dibujarHud() {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText( 'Puntos: ' + estado.puntos, 16, ALTO_HUD / 2 );
  ctx.textAlign = 'right';
  ctx.fillText( 'Vidas: ' + estado.vidas, ANCHO - 16, ALTO_HUD / 2 );

  // Línea de la pared superior
  ctx.fillStyle = '#444';
  ctx.fillRect( 0, ALTO_HUD - 2, ANCHO, 2 );
}

const MENSAJES = {
  inicio: { titulo: '', instruccion: 'Pulsa Espacio para empezar' },
  pausa: { titulo: 'PAUSA', instruccion: 'Pulsa P o Esc para continuar' },
  derrota: { titulo: 'GAME OVER', instruccion: 'Pulsa Espacio para reiniciar' },
  victoria: { titulo: '¡VICTORIA!', instruccion: 'Pulsa Espacio para reiniciar' },
};

function dibujarMensaje() {
  const mensaje = MENSAJES[ estado.fase ];
  if ( !mensaje ) return;

  const centroY = ALTO / 2 + 60;

  // Fondo semitransparente detrás del texto
  ctx.fillStyle = 'rgba( 0, 0, 0, 0.7 )';
  ctx.fillRect( 0, centroY - 60, ANCHO, 120 );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ( mensaje.titulo ) {
    ctx.font = 'bold 40px monospace';
    ctx.fillText( mensaje.titulo, ANCHO / 2, centroY - 18 );
  }
  ctx.font = '18px monospace';
  ctx.fillText( mensaje.instruccion, ANCHO / 2, mensaje.titulo ? centroY + 26 : centroY );
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
colocarBolaEnPala();

loadSpritesheet( () => {
  ultimoTiempo = performance.now();
  requestAnimationFrame( bucle );
} );
