const servicioMqtt = new ServicioMqttWeb();

const ui = {
  modal: document.getElementById('modal-conexion'),
  formulario: document.getElementById('form-conexion'),
  usuario: document.getElementById('aio-usuario'),
  clave: document.getElementById('aio-key'),
  alternarClave: document.getElementById('alternar-clave'),
  errorConexion: document.getElementById('error-conexion'),
  botonConectar: document.getElementById('boton-conectar'),
  botonCredenciales: document.getElementById('boton-credenciales'),
  estadoMqtt: document.getElementById('estado-websocket'),
  estadoEsp32: document.getElementById('estado-esp32'),
  textoLocal: document.getElementById('texto-local'),
  morseLocal: document.getElementById('morse-local'),
  horaLocal: document.getElementById('hora-local'),
  reproducirLocal: document.getElementById('reproducir-local'),
  copiarLocal: document.getElementById('copiar-local'),
  textoRemoto: document.getElementById('texto-remoto'),
  morseRemoto: document.getElementById('morse-remoto'),
  reproducirRemoto: document.getElementById('reproducir-remoto'),
  enviarRemoto: document.getElementById('enviar-remoto'),
  contador: document.getElementById('contador'),
  avisoCaracteres: document.getElementById('aviso-caracteres'),
  historial: document.getElementById('historial'),
  limpiarHistorial: document.getElementById('limpiar-historial'),
  ultimoEvento: document.getElementById('ultimo-evento'),
  notificacion: document.getElementById('notificacion')
};

let ultimoTextoLocal = '';
let ultimoMorseLocal = '';
let historial = JSON.parse(sessionStorage.getItem('historialMorse') || '[]');
let temporizadorNotificacion;

function horaActual() {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date());
}

function mostrarNotificacion(mensaje, error = false) {
  clearTimeout(temporizadorNotificacion);
  ui.notificacion.textContent = mensaje;
  ui.notificacion.className = `notificacion visible${error ? ' error' : ''}`;
  temporizadorNotificacion = setTimeout(() => {
    ui.notificacion.className = 'notificacion';
  }, 2600);
}

function establecerChip(elemento, conectado, texto) {
  elemento.className = `chip estado ${conectado ? 'conectado' : 'desconectado'}`;
  elemento.innerHTML = `<span></span>${texto}`;
}

function guardarHistorial() {
  sessionStorage.setItem('historialMorse', JSON.stringify(historial.slice(0, 50)));
}

function registrarActividad(origen, texto, codigo) {
  const evento = { hora: horaActual(), origen, texto, codigo };
  historial.unshift(evento);
  historial = historial.slice(0, 50);
  guardarHistorial();
  renderizarHistorial();
  ui.ultimoEvento.textContent = evento.hora;
}

function renderizarHistorial() {
  if (!historial.length) {
    ui.historial.innerHTML = '<div class="historial-vacio">Todavía no hay mensajes en esta sesión.</div>';
    return;
  }

  ui.historial.innerHTML = historial.map(evento => `
    <article class="evento">
      <div class="evento-hora">${evento.hora}</div>
      <div class="evento-origen ${evento.origen === 'PLACA' ? 'placa' : 'web'}">
        ${evento.origen === 'PLACA' ? '↑ PLACA → WEB' : '↓ WEB → PLACA'}
      </div>
      <div class="evento-texto">
        <strong>${escaparHtml(evento.texto)}</strong>
        <code>${escaparHtml(evento.codigo || '—')}</code>
      </div>
    </article>
  `).join('');
}

function escaparHtml(texto) {
  return String(texto).replace(/[&<>'"]/g, caracter => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[caracter]);
}

function actualizarVistaPrevia() {
  const texto = ui.textoRemoto.value;
  const resultado = textoAMorse(texto);
  ui.contador.textContent = `${texto.length}/120`;
  ui.morseRemoto.textContent = resultado.codigo || 'La traducción aparecerá aquí.';
  ui.reproducirRemoto.disabled = !resultado.codigo;
  ui.enviarRemoto.disabled = !texto.trim() || !servicioMqtt.conectado;
  ui.avisoCaracteres.textContent = resultado.invalidos.length
    ? `Se omitirán: ${[...new Set(resultado.invalidos)].join(' ')}`
    : '';
}

function procesarFeed(feed, valor) {
  if (feed === 'morse-texto-local') {
    ultimoTextoLocal = valor;
    ui.textoLocal.textContent = valor;
    ui.textoLocal.classList.remove('vacio');
    ui.horaLocal.textContent = horaActual();
    comprobarMensajeLocalCompleto();
  }

  if (feed === 'morse-codigo-local') {
    ultimoMorseLocal = valor;
    ui.morseLocal.textContent = valor || '—';
    ui.reproducirLocal.disabled = !valor;
    ui.copiarLocal.disabled = !valor;
    comprobarMensajeLocalCompleto();
  }

  if (feed === 'morse-estado') {
    const online = valor.trim() === '1';
    establecerChip(ui.estadoEsp32, online, online ? 'ESP32 online' : 'ESP32 sin señal');
  }
}

let ultimoRegistroLocal = '';
function comprobarMensajeLocalCompleto() {
  if (!ultimoTextoLocal || !ultimoMorseLocal) return;
  const firma = `${ultimoTextoLocal}|${ultimoMorseLocal}`;
  if (firma === ultimoRegistroLocal) return;
  ultimoRegistroLocal = firma;
  registrarActividad('PLACA', ultimoTextoLocal, ultimoMorseLocal);
}

servicioMqtt.alMensaje = procesarFeed;
servicioMqtt.alEstado = (estado, detalle) => {
  if (estado === 'conectado') {
    establecerChip(ui.estadoMqtt, true, 'MQTT conectado');
    ui.modal.classList.remove('visible');
    ui.errorConexion.textContent = '';
    actualizarVistaPrevia();
  } else if (estado === 'reconectando') {
    establecerChip(ui.estadoMqtt, false, 'MQTT reconectando');
  } else {
    establecerChip(ui.estadoMqtt, false, 'MQTT desconectado');
    actualizarVistaPrevia();
    if (estado === 'error' && detalle) ui.errorConexion.textContent = detalle;
  }
};

ui.formulario.addEventListener('submit', async evento => {
  evento.preventDefault();
  const usuario = ui.usuario.value.trim();
  const clave = ui.clave.value.trim();

  if (!usuario || !clave.startsWith('aio_')) {
    ui.errorConexion.textContent = 'Ingresá un usuario y una AIO Key válida que comience con aio_.';
    return;
  }

  ui.botonConectar.disabled = true;
  ui.botonConectar.textContent = 'Conectando...';
  ui.errorConexion.textContent = '';

  try {
    sessionStorage.setItem('aioUsuario', usuario);
    sessionStorage.setItem('aioKey', clave);
    await servicioMqtt.conectar(usuario, clave);
    mostrarNotificacion('Conexión MQTT establecida');
  } catch (error) {
    ui.errorConexion.textContent = `No se pudo conectar: ${error.message || error}`;
  } finally {
    ui.botonConectar.disabled = false;
    ui.botonConectar.textContent = 'Conectar';
  }
});

ui.alternarClave.addEventListener('click', () => {
  const mostrar = ui.clave.type === 'password';
  ui.clave.type = mostrar ? 'text' : 'password';
  ui.alternarClave.textContent = mostrar ? 'Ocultar' : 'Ver';
});

ui.botonCredenciales.addEventListener('click', () => ui.modal.classList.add('visible'));
ui.textoRemoto.addEventListener('input', actualizarVistaPrevia);

ui.reproducirRemoto.addEventListener('click', async () => {
  const codigo = textoAMorse(ui.textoRemoto.value).codigo;
  ui.reproducirRemoto.disabled = true;
  await reproducirMorse(codigo);
  ui.reproducirRemoto.disabled = false;
});

ui.reproducirLocal.addEventListener('click', async () => {
  ui.reproducirLocal.disabled = true;
  await reproducirMorse(ultimoMorseLocal);
  ui.reproducirLocal.disabled = false;
});

ui.copiarLocal.addEventListener('click', async () => {
  await navigator.clipboard.writeText(ultimoMorseLocal);
  mostrarNotificacion('Código Morse copiado');
});

ui.enviarRemoto.addEventListener('click', async () => {
  const texto = ui.textoRemoto.value.trim();
  const resultado = textoAMorse(texto);
  if (!texto || !servicioMqtt.conectado) return;

  ui.enviarRemoto.disabled = true;
  ui.enviarRemoto.textContent = 'Enviando...';

  try {
    await servicioMqtt.publicar('morse-texto-remoto', texto);
    registrarActividad('WEB', texto, resultado.codigo);
    ui.textoRemoto.value = '';
    actualizarVistaPrevia();
    mostrarNotificacion('Mensaje enviado al ESP32');
  } catch (error) {
    mostrarNotificacion(error.message || 'No se pudo enviar', true);
  } finally {
    ui.enviarRemoto.textContent = 'Enviar al ESP32 →';
    actualizarVistaPrevia();
  }
});

ui.limpiarHistorial.addEventListener('click', () => {
  historial = [];
  guardarHistorial();
  renderizarHistorial();
  mostrarNotificacion('Historial de sesión eliminado');
});

window.addEventListener('load', () => {
  ui.usuario.value = sessionStorage.getItem('aioUsuario') || 'Ivansch123';
  ui.clave.value = sessionStorage.getItem('aioKey') || '';
  renderizarHistorial();
  actualizarVistaPrevia();
});
