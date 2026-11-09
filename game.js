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

// Cuadrícula de ladrillos: hasta 12 filas × 10 columnas de 40×20, desde (40, 80) (spec 03)
const COLUMNAS = 10;
const FILAS_MAX = 12;
const LADRILLO_W = 40;
const LADRILLO_H = 20;
const REJILLA_X = 40;
const REJILLA_Y = 80;

// Ladrillos del nivel en juego: { x, y, w, h, color, vivo, indestructible }
const ladrillos = [];

// Efectos de rotura (spec 02)
const DURACION_EXPLOSION = 0.32; // s, total de los 4 frames

const PARTICULAS_POR_LADRILLO = 8;
const TAM_PARTICULA = 3; // px
const VEL_PARTICULA_MIN = 60; // px/s
const VEL_PARTICULA_MAX = 180; // px/s
const GRAVEDAD_PARTICULA = 600; // px/s²
const VIDA_PARTICULA = 0.5; // s
const SACUDIDA_MAX = 3; // px
const DURACION_SACUDIDA = 0.12; // s

// Explosiones en curso: { x, y, w, h, color, t } — t en segundos de juego transcurridos
const explosiones = [];

// Partículas en curso: { x, y, vx, vy, color, t } — color es un nombre CSS válido
const particulas = [];

// Sacudida en curso: t es el tiempo restante; dx/dy, el desplazamiento del frame actual
const sacudida = { t: 0, dx: 0, dy: 0 };

// Crea los ladrillos a partir de un mapa de texto de levels.js (un carácter por celda)
function crearLadrillos( mapa ) {
  ladrillos.length = 0;
  if ( mapa.length > FILAS_MAX ) console.warn( 'Mapa con más de ' + FILAS_MAX + ' filas; se ignoran las sobrantes' );

  mapa.slice( 0, FILAS_MAX ).forEach( ( filaTexto, fila ) => {
    if ( filaTexto.length > COLUMNAS ) console.warn( 'Fila ' + fila + ' con más de ' + COLUMNAS + ' columnas; se ignoran las sobrantes' );

    for ( let col = 0; col < Math.min( filaTexto.length, COLUMNAS ); col++ ) {
      const caracter = filaTexto[ col ];
      if ( caracter === '.' ) continue;

      const color = LEYENDA[ caracter ];
      if ( !color ) {
        console.warn( 'Carácter desconocido "' + caracter + '" en fila ' + fila + ', columna ' + col + '; se deja vacía' );
        continue;
      }

      ladrillos.push( {
        x: REJILLA_X + col * LADRILLO_W,
        y: REJILLA_Y + fila * LADRILLO_H,
        w: LADRILLO_W,
        h: LADRILLO_H,
        color,
        vivo: true,
        indestructible: caracter === '#',
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
  crearLadrillos( NIVELES[ 0 ] );
  explosiones.length = 0;
  particulas.length = 0;
  sacudida.t = 0;
  sacudida.dx = 0;
  sacudida.dy = 0;
  estado.fase = 'saque';
}

// Bola perdida por abajo o nivel completado
function comprobarFinDeBola() {
  if ( bola.y > ALTO ) {
    estado.vidas--;
    estado.fase = estado.vidas > 0 ? 'saque' : 'derrota';
  } else if ( !ladrillos.some( ( l ) => l.vivo && !l.indestructible ) ) {
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

  // Muro: rebota y suena, pero no se rompe ni da puntos
  if ( l.indestructible ) {
    reproducir( sonidoRebote );
    return;
  }

  l.vivo = false;
  explosiones.push( { x: l.x, y: l.y, w: l.w, h: l.h, color: l.color, t: 0 } );
  crearParticulas( l );
  sacudida.t = DURACION_SACUDIDA; // se reinicia, no se acumula
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

  // El campo de juego tiembla; el HUD y los mensajes, no
  ctx.save();
  ctx.translate( sacudida.dx, sacudida.dy );

  for ( const l of ladrillos ) {
    if ( l.vivo ) drawSprite( ctx, 'block_' + l.color, l.x, l.y, l.w, l.h );
  }

  dibujarExplosiones();
  dibujarParticulas();

  drawSprite( ctx, 'paddle', pala.x, pala.y, pala.w, pala.h );
  drawSprite( ctx, 'ball', bola.x, bola.y, bola.w, bola.h );

  ctx.restore();

  dibujarHud();
  dibujarMensaje();
}

// Partículas desde el centro del ladrillo, con dirección y velocidad aleatorias
function crearParticulas( l ) {
  for ( let i = 0; i < PARTICULAS_POR_LADRILLO; i++ ) {
    const angulo = Math.random() * Math.PI * 2;
    const vel = VEL_PARTICULA_MIN + Math.random() * ( VEL_PARTICULA_MAX - VEL_PARTICULA_MIN );
    particulas.push( {
      x: l.x + l.w / 2 - TAM_PARTICULA / 2,
      y: l.y + l.h / 2 - TAM_PARTICULA / 2,
      vx: Math.cos( angulo ) * vel,
      vy: Math.sin( angulo ) * vel,
      color: l.color,
      t: 0,
    } );
  }
}

// Avanza los efectos con el tiempo de juego; no se llama en pausa
function actualizarEfectos( dt ) {
  for ( let i = explosiones.length - 1; i >= 0; i-- ) {
    explosiones[ i ].t += dt;
    if ( explosiones[ i ].t >= DURACION_EXPLOSION ) explosiones.splice( i, 1 );
  }

  for ( let i = particulas.length - 1; i >= 0; i-- ) {
    const p = particulas[ i ];
    p.t += dt;
    if ( p.t >= VIDA_PARTICULA ) {
      particulas.splice( i, 1 );
      continue;
    }
    p.vy += GRAVEDAD_PARTICULA * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  // dx/dy solo cambian aquí, así la imagen no tiembla en pausa
  if ( sacudida.t > 0 ) {
    sacudida.t = Math.max( 0, sacudida.t - dt );
    const amplitud = SACUDIDA_MAX * sacudida.t / DURACION_SACUDIDA;
    sacudida.dx = ( Math.random() * 2 - 1 ) * amplitud;
    sacudida.dy = ( Math.random() * 2 - 1 ) * amplitud;
  }
}

// La opacidad baja de 1 a 0 a lo largo de la vida de la partícula
function dibujarParticulas() {
  for ( const p of particulas ) {
    ctx.globalAlpha = 1 - p.t / VIDA_PARTICULA;
    ctx.fillStyle = p.color;
    ctx.fillRect( p.x, p.y, TAM_PARTICULA, TAM_PARTICULA );
  }
  ctx.globalAlpha = 1;
}

function dibujarExplosiones() {
  for ( const ex of explosiones ) {
    const frames = EXPLOSION_FRAMES[ ex.color ];
    const indice = Math.min( frames.length - 1, Math.floor( ex.t / ( DURACION_EXPLOSION / 4 ) ) );
    // EXPLOSION_FRAMES.gray apunta a los frames rojos: se desaturan con un filtro
    if ( ex.color === 'gray' ) ctx.filter = 'grayscale(1)';
    drawFrame( ctx, frames[ indice ], ex.x, ex.y, ex.w, ex.h );
    if ( ex.color === 'gray' ) ctx.filter = 'none';
  }
}

// Puntos y vidas en la franja superior (y < ALTO_HUD)
function dibujarHud() {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText( 'Puntos: ' + estado.puntos, 16, ALTO_HUD / 2 );
  ctx.textAlign = 'right';

  // Una bola por vida, alineadas a la derecha, con la etiqueta a su izquierda
  const TAM_ICONO = 16;
  const SEP_ICONO = 6;
  let x = ANCHO - 16 - TAM_ICONO;
  for ( let i = 0; i < estado.vidas; i++ ) {
    drawSprite( ctx, 'ball', x, ( ALTO_HUD - TAM_ICONO ) / 2, TAM_ICONO, TAM_ICONO );
    x -= TAM_ICONO + SEP_ICONO;
  }
  ctx.fillText( 'Vidas:', x + TAM_ICONO, ALTO_HUD / 2 );

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
  if ( estado.fase !== 'pausa' ) actualizarEfectos( dt );
  dibujar();

  requestAnimationFrame( bucle );
}

crearLadrillos( NIVELES[ 0 ] );
colocarBolaEnPala();

loadSpritesheet( () => {
  ultimoTiempo = performance.now();
  requestAnimationFrame( bucle );
} );
