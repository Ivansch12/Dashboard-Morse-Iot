const DICCIONARIO_MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', 'Ñ': '--.--', O: '---', P: '.--.', Q: '--.-',
  R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--',
  X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.'
};

function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, coincidencia => coincidencia === 'ñ' ? 'Ñ' : 'Ñ')
    .toUpperCase();
}

function textoAMorse(texto) {
  const normalizado = normalizarTexto(texto);
  const partes = [];
  const invalidos = [];

  for (const caracter of normalizado) {
    if (caracter === ' ') {
      partes.push('/');
    } else if (DICCIONARIO_MORSE[caracter]) {
      partes.push(DICCIONARIO_MORSE[caracter]);
    } else {
      invalidos.push(caracter);
    }
  }

  return {
    textoNormalizado: normalizado,
    codigo: partes.join(' '),
    invalidos
  };
}

async function reproducirMorse(codigo, unidad = 150, frecuencia = 800) {
  if (!codigo) return;

  const contexto = new (window.AudioContext || window.webkitAudioContext)();
  let cursor = contexto.currentTime + 0.08;
  const segundosUnidad = unidad / 1000;

  const sonar = duracionUnidades => {
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();
    oscilador.frequency.value = frecuencia;
    ganancia.gain.setValueAtTime(0.0001, cursor);
    ganancia.gain.exponentialRampToValueAtTime(0.18, cursor + 0.01);
    ganancia.gain.setValueAtTime(0.18, cursor + duracionUnidades * segundosUnidad - 0.01);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, cursor + duracionUnidades * segundosUnidad);
    oscilador.connect(ganancia).connect(contexto.destination);
    oscilador.start(cursor);
    oscilador.stop(cursor + duracionUnidades * segundosUnidad);
    cursor += duracionUnidades * segundosUnidad;
  };

  for (const simbolo of codigo) {
    if (simbolo === '.') {
      sonar(1);
      cursor += segundosUnidad;
    } else if (simbolo === '-') {
      sonar(3);
      cursor += segundosUnidad;
    } else if (simbolo === ' ') {
      cursor += segundosUnidad * 2;
    } else if (simbolo === '/') {
      cursor += segundosUnidad * 4;
    }
  }

  const espera = Math.max(0, (cursor - contexto.currentTime) * 1000 + 100);
  await new Promise(resolve => setTimeout(resolve, espera));
  await contexto.close();
}
