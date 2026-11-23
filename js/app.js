// ==========================================================
// DASHBOARD TRADUCTOR MORSE IOT
// LOGICA PRINCIPAL DE LA INTERFAZ
//
// Autores:
// SCHLEGEL, MOREIRA, STAMM
// ==========================================================


// ==========================================================
// SERVICIO MQTT
// ==========================================================

const servicioMqtt = new ServicioMqttWeb();


// ==========================================================
// ELEMENTOS DE LA INTERFAZ
// ==========================================================

const ui = {

    modal:
        document.getElementById(
            "modal-conexion"
        ),

    formulario:
        document.getElementById(
            "form-conexion"
        ),

    usuario:
        document.getElementById(
            "aio-usuario"
        ),

    clave:
        document.getElementById(
            "aio-key"
        ),

    alternarClave:
        document.getElementById(
            "alternar-clave"
        ),

    errorConexion:
        document.getElementById(
            "error-conexion"
        ),

    botonConectar:
        document.getElementById(
            "boton-conectar"
        ),

    botonCredenciales:
        document.getElementById(
            "boton-credenciales"
        ),

    estadoMqtt:
        document.getElementById(
            "estado-websocket"
        ),

    estadoEsp32:
        document.getElementById(
            "estado-esp32"
        ),

    textoLocal:
        document.getElementById(
            "texto-local"
        ),

    morseLocal:
        document.getElementById(
            "morse-local"
        ),

    horaLocal:
        document.getElementById(
            "hora-local"
        ),

    reproducirLocal:
        document.getElementById(
            "reproducir-local"
        ),

    copiarLocal:
        document.getElementById(
            "copiar-local"
        ),

    textoRemoto:
        document.getElementById(
            "texto-remoto"
        ),

    morseRemoto:
        document.getElementById(
            "morse-remoto"
        ),

    reproducirRemoto:
        document.getElementById(
            "reproducir-remoto"
        ),

    enviarRemoto:
        document.getElementById(
            "enviar-remoto"
        ),

    contador:
        document.getElementById(
            "contador"
        ),

    avisoCaracteres:
        document.getElementById(
            "aviso-caracteres"
        ),

    historial:
        document.getElementById(
            "historial"
        ),

    limpiarHistorial:
        document.getElementById(
            "limpiar-historial"
        ),

    ultimoEvento:
        document.getElementById(
            "ultimo-evento"
        ),

    notificacion:
        document.getElementById(
            "notificacion"
        )
};


// ==========================================================
// VARIABLES DE ESTADO
// ==========================================================

let ultimoTextoLocal = "";

let ultimoMorseLocal = "";

let ultimoRegistroLocal = "";

let temporizadorNotificacion;


// ==========================================================
// RECUPERAR HISTORIAL
// ==========================================================

let historial = JSON.parse(

    sessionStorage.getItem(
        "historialMorse"
    )

    ||

    "[]"
);


// ==========================================================
// HORA ACTUAL
// ==========================================================

function horaActual() {

    return new Intl.DateTimeFormat(

        "es-AR",

        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }

    ).format(
        new Date()
    );
}


// ==========================================================
// NOTIFICACIONES
// ==========================================================

function mostrarNotificacion(
    mensaje,
    error = false
) {

    clearTimeout(
        temporizadorNotificacion
    );


    ui.notificacion.textContent = (
        mensaje
    );


    ui.notificacion.className = (
        `notificacion visible${

            error
                ? " error"
                : ""

        }`
    );


    temporizadorNotificacion = (
        setTimeout(
            () => {

                ui.notificacion.className = (
                    "notificacion"
                );

            },

            2600
        )
    );
}


// ==========================================================
// INDICADORES DE ESTADO
// ==========================================================

function establecerChip(
    elemento,
    conectado,
    texto
) {

    elemento.className = (
        `chip estado ${
            conectado
                ? "conectado"
                : "desconectado"
        }`
    );


    elemento.innerHTML = (
        `<span></span>${texto}`
    );
}


// ==========================================================
// GUARDAR HISTORIAL
// ==========================================================

function guardarHistorial() {

    sessionStorage.setItem(

        "historialMorse",

        JSON.stringify(

            historial.slice(
                0,
                50
            )
        )
    );
}


// ==========================================================
// REGISTRAR ACTIVIDAD
// ==========================================================

function registrarActividad(
    origen,
    textoOriginal,
    textoNormalizado,
    codigo
) {

    const evento = {

        hora:
            horaActual(),

        origen:
            origen,

        textoOriginal:
            textoOriginal,

        textoNormalizado:
            textoNormalizado,

        codigo:
            codigo
    };


    historial.unshift(
        evento
    );


    historial = historial.slice(
        0,
        50
    );


    guardarHistorial();

    renderizarHistorial();


    ui.ultimoEvento.textContent = (
        evento.hora
    );
}


// ==========================================================
// COMPATIBILIDAD CON HISTORIAL ANTERIOR
// ==========================================================

function obtenerTextoOriginal(
    evento
) {

    // ------------------------------------------
    // Nuevo formato
    // ------------------------------------------

    if (
        evento.textoOriginal
        !== undefined
    ) {

        return evento.textoOriginal;
    }


    // ------------------------------------------
    // Formato utilizado en la primera version
    // del dashboard.
    // ------------------------------------------

    if (
        evento.texto
        !== undefined
    ) {

        return evento.texto;
    }


    return "";
}


function obtenerTextoNormalizado(
    evento
) {

    if (
        evento.textoNormalizado
        !== undefined
    ) {

        return evento.textoNormalizado;
    }


    // ------------------------------------------
    // Si se trata de un registro viejo,
    // calculamos la normalizacion ahora.
    // ------------------------------------------

    return normalizarTexto(
        obtenerTextoOriginal(
            evento
        )
    );
}


// ==========================================================
// DECIDIR SI MOSTRAR NORMALIZACION
// ==========================================================

// ==========================================================
// DECIDIR SI MOSTRAR NORMALIZACION
// ==========================================================

function debeMostrarNormalizacion(
    original
) {

    // Mostramos INTERPRETADO solamente cuando
    // encontramos caracteres que el traductor
    // necesita reemplazar.

    const caracteresNormalizados =
        /[áÁéÉíÍóÓúÚüÜàÀèÈìÌòÒùÙâÂêÊîÎôÔûÛäÄëËïÏöÖ]/;


    return caracteresNormalizados.test(
        original
    );
}

// ==========================================================
// RENDERIZAR HISTORIAL
// ==========================================================

function renderizarHistorial() {

    if (!historial.length) {

        ui.historial.innerHTML = (
            '<div class="historial-vacio">'
            +
            "Todavía no hay mensajes en esta sesión."
            +
            "</div>"
        );

        return;
    }


    ui.historial.innerHTML = (
        historial.map(

            evento => {

                const original = (
                    obtenerTextoOriginal(
                        evento
                    )
                );


                const normalizado = (
                    obtenerTextoNormalizado(
                        evento
                    )
                );


                const mostrarNormalizado = (
    debeMostrarNormalizacion(
        original
    )
);


                // ==========================================
                // BLOQUE DE NORMALIZACION
                // ==========================================

                let bloqueNormalizacion = "";


                if (mostrarNormalizado) {

                    bloqueNormalizacion = `

                        <div class="evento-normalizado">

                            <span class="evento-etiqueta">
                                INTERPRETADO
                            </span>

                            <span>
                                ${escaparHtml(
                                    normalizado
                                )}
                            </span>

                        </div>

                    `;
                }


                // ==========================================
                // EVENTO
                // ==========================================

                return `

                    <article class="evento">

                        <div class="evento-hora">

                            ${evento.hora}

                        </div>


                        <div
                            class="
                                evento-origen
                                ${
                                    evento.origen
                                    === "PLACA"

                                        ? "placa"

                                        : "web"
                                }
                            "
                        >

                            ${
                                evento.origen
                                === "PLACA"

                                    ? "↑ PLACA → WEB"

                                    : "↓ WEB → PLACA"
                            }

                        </div>


                        <div class="evento-texto">


                            <div class="evento-original">

                                <span class="evento-etiqueta">
                                    ORIGINAL
                                </span>

                                <strong>

                                    ${escaparHtml(
                                        original
                                    )}

                                </strong>

                            </div>


                            ${bloqueNormalizacion}


                            <div class="evento-morse">

                                <span class="evento-etiqueta">
                                    MORSE
                                </span>

                                <code>

                                    ${escaparHtml(
                                        evento.codigo
                                        ||
                                        "—"
                                    )}

                                </code>

                            </div>


                        </div>

                    </article>

                `;
            }

        ).join("")
    );
}


// ==========================================================
// ESCAPAR HTML
// ==========================================================

function escaparHtml(texto) {

    return String(texto).replace(

        /[&<>'"]/g,

        caracter => (

            {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"
            }

        )[caracter]
    );
}


// ==========================================================
// VISTA PREVIA DEL MENSAJE REMOTO
// ==========================================================

function actualizarVistaPrevia() {

    const texto = (
        ui.textoRemoto.value
    );


    const resultado = (
        textoAMorse(
            texto
        )
    );


    // ------------------------------------------------------
    // CONTADOR
    // ------------------------------------------------------

    ui.contador.textContent = (
        `${texto.length}/120`
    );


    // ------------------------------------------------------
    // MORSE
    // ------------------------------------------------------

    ui.morseRemoto.textContent = (

        resultado.codigo

        ||

        "La traducción aparecerá aquí."
    );


    // ------------------------------------------------------
    // BOTON ESCUCHAR
    // ------------------------------------------------------

    ui.reproducirRemoto.disabled = (
        !resultado.codigo
    );


    // ------------------------------------------------------
    // BOTON ENVIAR
    // ------------------------------------------------------

    ui.enviarRemoto.disabled = (

        !texto.trim()

        ||

        !servicioMqtt.conectado
    );


    // ------------------------------------------------------
    // CARACTERES INVALIDOS
    // ------------------------------------------------------

    ui.avisoCaracteres.textContent = (

        resultado.invalidos.length

        ?

        (
            "Se omitirán: "
            +
            [
                ...new Set(
                    resultado.invalidos
                )
            ].join(" ")
        )

        :

        ""
    );
}


// ==========================================================
// PROCESAR FEEDS MQTT
// ==========================================================

function procesarFeed(
    feed,
    valor
) {

    // ======================================================
    // TEXTO DESDE ESP32
    // ======================================================

    if (
        feed ===
        "morse-texto-local"
    ) {

        ultimoTextoLocal = (
            valor
        );


        ui.textoLocal.textContent = (
            valor
        );


        ui.textoLocal.classList.remove(
            "vacio"
        );


        ui.horaLocal.textContent = (
            horaActual()
        );


        comprobarMensajeLocalCompleto();
    }


    // ======================================================
    // MORSE DESDE ESP32
    // ======================================================

    if (
        feed ===
        "morse-codigo-local"
    ) {

        ultimoMorseLocal = (
            valor
        );


        ui.morseLocal.textContent = (
            valor
            ||
            "—"
        );


        ui.reproducirLocal.disabled = (
            !valor
        );


        ui.copiarLocal.disabled = (
            !valor
        );


        comprobarMensajeLocalCompleto();
    }


    // ======================================================
    // ESTADO DEL ESP32
    // ======================================================

    if (
        feed ===
        "morse-estado"
    ) {

        const online = (
            valor.trim() === "1"
        );


        establecerChip(

            ui.estadoEsp32,

            online,

            online

                ? "ESP32 online"

                : "ESP32 sin señal"
        );
    }
}


// ==========================================================
// COMPROBAR MENSAJE LOCAL COMPLETO
// ==========================================================

function comprobarMensajeLocalCompleto() {

    if (
        !ultimoTextoLocal
        ||
        !ultimoMorseLocal
    ) {

        return;
    }


    const firma = (

        `${ultimoTextoLocal}`
        +
        "|"
        +
        `${ultimoMorseLocal}`
    );


    if (
        firma ===
        ultimoRegistroLocal
    ) {

        return;
    }


    ultimoRegistroLocal = (
        firma
    );


    // ------------------------------------------------------
    // El texto que envia el ESP32 ya esta traducido.
    //
    // De todos modos calculamos su normalizacion para que
    // el formato del historial sea consistente.
    // ------------------------------------------------------

    const normalizado = (
        normalizarTexto(
            ultimoTextoLocal
        )
    );


    registrarActividad(

        "PLACA",

        ultimoTextoLocal,

        normalizado,

        ultimoMorseLocal
    );
}


// ==========================================================
// RECEPCION MQTT GENERAL
// ==========================================================

servicioMqtt.alMensaje = (
    procesarFeed
);


// ==========================================================
// ESTADO MQTT DEL NAVEGADOR
// ==========================================================

servicioMqtt.alEstado = (
    estado,
    detalle
) => {

    if (
        estado ===
        "conectado"
    ) {

        establecerChip(
            ui.estadoMqtt,
            true,
            "MQTT conectado"
        );


        ui.modal.classList.remove(
            "visible"
        );


        ui.errorConexion.textContent = "";


        actualizarVistaPrevia();
    }


    else if (
        estado ===
        "reconectando"
    ) {

        establecerChip(
            ui.estadoMqtt,
            false,
            "MQTT reconectando"
        );
    }


    else {

        establecerChip(
            ui.estadoMqtt,
            false,
            "MQTT desconectado"
        );


        actualizarVistaPrevia();


        if (
            estado === "error"
            &&
            detalle
        ) {

            ui.errorConexion.textContent = (
                detalle
            );
        }
    }
};


// ==========================================================
// FORMULARIO DE CONEXION
// ==========================================================

ui.formulario.addEventListener(

    "submit",

    async evento => {

        evento.preventDefault();


        const usuario = (
            ui.usuario.value.trim()
        );


        const clave = (
            ui.clave.value.trim()
        );


        // --------------------------------------------------
        // VALIDACION BASICA
        // --------------------------------------------------

        if (
            !usuario
            ||
            !clave.startsWith(
                "aio_"
            )
        ) {

            ui.errorConexion.textContent = (
                "Ingresá un usuario y una AIO Key "
                +
                "válida que comience con aio_."
            );

            return;
        }


        // --------------------------------------------------
        // ESTADO DEL BOTON
        // --------------------------------------------------

        ui.botonConectar.disabled = (
            true
        );


        ui.botonConectar.textContent = (
            "Conectando..."
        );


        ui.errorConexion.textContent = "";


        // --------------------------------------------------
        // CONEXION
        // --------------------------------------------------

        try {

            sessionStorage.setItem(
                "aioUsuario",
                usuario
            );


            sessionStorage.setItem(
                "aioKey",
                clave
            );


            await servicioMqtt.conectar(
                usuario,
                clave
            );


            mostrarNotificacion(
                "Conexión MQTT establecida"
            );
        }


        catch (error) {

            ui.errorConexion.textContent = (

                "No se pudo conectar: "

                +

                (
                    error.message
                    ||
                    error
                )
            );
        }


        finally {

            ui.botonConectar.disabled = (
                false
            );


            ui.botonConectar.textContent = (
                "Conectar"
            );
        }
    }
);


// ==========================================================
// MOSTRAR / OCULTAR AIO KEY
// ==========================================================

ui.alternarClave.addEventListener(

    "click",

    () => {

        const mostrar = (
            ui.clave.type
            ===
            "password"
        );


        ui.clave.type = (
            mostrar
                ? "text"
                : "password"
        );


        ui.alternarClave.textContent = (
            mostrar
                ? "Ocultar"
                : "Ver"
        );
    }
);


// ==========================================================
// BOTON CREDENCIALES
// ==========================================================

ui.botonCredenciales.addEventListener(

    "click",

    () => (

        ui.modal.classList.add(
            "visible"
        )
    )
);


// ==========================================================
// CAMBIOS EN EL TEXTO
// ==========================================================

ui.textoRemoto.addEventListener(

    "input",

    actualizarVistaPrevia
);


// ==========================================================
// REPRODUCIR MENSAJE WEB
// ==========================================================

ui.reproducirRemoto.addEventListener(

    "click",

    async () => {

        const codigo = (

            textoAMorse(
                ui.textoRemoto.value
            ).codigo
        );


        ui.reproducirRemoto.disabled = (
            true
        );


        await reproducirMorse(
            codigo
        );


        ui.reproducirRemoto.disabled = (
            false
        );
    }
);


// ==========================================================
// REPRODUCIR MENSAJE DEL ESP32
// ==========================================================

ui.reproducirLocal.addEventListener(

    "click",

    async () => {

        ui.reproducirLocal.disabled = (
            true
        );


        await reproducirMorse(
            ultimoMorseLocal
        );


        ui.reproducirLocal.disabled = (
            false
        );
    }
);


// ==========================================================
// COPIAR MORSE
// ==========================================================

ui.copiarLocal.addEventListener(

    "click",

    async () => {

        await navigator.clipboard.writeText(
            ultimoMorseLocal
        );


        mostrarNotificacion(
            "Código Morse copiado"
        );
    }
);


// ==========================================================
// ENVIAR MENSAJE AL ESP32
// ==========================================================

ui.enviarRemoto.addEventListener(

    "click",

    async () => {

        // --------------------------------------------------
        // TEXTO ORIGINAL
        // --------------------------------------------------

        const textoOriginal = (
            ui.textoRemoto.value.trim()
        );


        // --------------------------------------------------
        // TRADUCCION
        // --------------------------------------------------

        const resultado = (
            textoAMorse(
                textoOriginal
            )
        );


        // --------------------------------------------------
        // VALIDACION
        // --------------------------------------------------

        if (
            !textoOriginal
            ||
            !servicioMqtt.conectado
        ) {

            return;
        }


        // --------------------------------------------------
        // PREPARAR BOTON
        // --------------------------------------------------

        ui.enviarRemoto.disabled = (
            true
        );


        ui.enviarRemoto.textContent = (
            "Enviando..."
        );


        try {

            // ==================================================
            // IMPORTANTE
            // ==================================================
            //
            // Enviamos el texto ORIGINAL al ESP32.
            //
            // Ejemplo:
            //
            // "Mañana"
            //
            // llega realmente como:
            //
            // "Mañana"
            //
            // El ESP32 aplica despues la misma normalizacion:
            //
            // "MAÑANA"
            //
            // Esto permite conservar el mensaje tal como fue
            // escrito en el historial.
            // ==================================================

            await servicioMqtt.publicar(

                "morse-texto-remoto",

                textoOriginal
            );


            // ==================================================
            // HISTORIAL
            // ==================================================

            registrarActividad(

                "WEB",

                textoOriginal,

                resultado.textoNormalizado,

                resultado.codigo
            );


            // ==================================================
            // LIMPIAR ENTRADA
            // ==================================================

            ui.textoRemoto.value = "";


            actualizarVistaPrevia();


            mostrarNotificacion(
                "Mensaje enviado al ESP32"
            );
        }


        catch (error) {

            mostrarNotificacion(

                error.message
                ||
                "No se pudo enviar",

                true
            );
        }


        finally {

            ui.enviarRemoto.textContent = (
                "Enviar al ESP32 →"
            );


            actualizarVistaPrevia();
        }
    }
);


// ==========================================================
// LIMPIAR HISTORIAL
// ==========================================================

ui.limpiarHistorial.addEventListener(

    "click",

    () => {

        historial = [];


        guardarHistorial();

        renderizarHistorial();


        mostrarNotificacion(
            "Historial de sesión eliminado"
        );
    }
);


// ==========================================================
// CARGA INICIAL
// ==========================================================

window.addEventListener(

    "load",

    () => {

        // --------------------------------------------------
        // USUARIO
        // --------------------------------------------------

        ui.usuario.value = (

            sessionStorage.getItem(
                "aioUsuario"
            )

            ||

            "Ivansch123"
        );


        // --------------------------------------------------
        // AIO KEY
        // --------------------------------------------------

        ui.clave.value = (

            sessionStorage.getItem(
                "aioKey"
            )

            ||

            ""
        );


        // --------------------------------------------------
        // HISTORIAL
        // --------------------------------------------------

        renderizarHistorial();


        // --------------------------------------------------
        // VISTA PREVIA
        // --------------------------------------------------

        actualizarVistaPrevia();
    }
);
