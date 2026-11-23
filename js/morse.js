// ==========================================================
// TRADUCTOR MORSE - DASHBOARD WEB
// Codigo Morse Internacional
//
// Proyecto Traductor Morse IoT
//
// Autores:
// SCHLEGEL, MOREIRA, STAMM
// ==========================================================


// ==========================================================
// DICCIONARIO TEXTO -> MORSE
// ==========================================================

const DICCIONARIO_MORSE = {

    // ------------------------------------------------------
    // LETRAS
    // ------------------------------------------------------

    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",

    // ------------------------------------------------------
    // EXTENSION PARA ESPAÑOL
    // ------------------------------------------------------

    "Ñ": "--.--",

    // ------------------------------------------------------
    // NUMEROS
    // ------------------------------------------------------

    0: "-----",
    1: ".----",
    2: "..---",
    3: "...--",
    4: "....-",
    5: ".....",
    6: "-....",
    7: "--...",
    8: "---..",
    9: "----.",

    // ------------------------------------------------------
    // SIGNOS
    // ------------------------------------------------------

    ".": ".-.-.-",
    ",": "--..--",
    "?": "..--..",
    "'": ".----.",
    "!": "-.-.--",
    "/": "-..-.",
    "(": "-.--.",
    ")": "-.--.-",
    "&": ".-...",
    ":": "---...",
    ";": "-.-.-.",
    "=": "-...-",
    "+": ".-.-.",
    "-": "-....-",
    "_": "..--.-",
    "\"": ".-..-.",
    "$": "...-..-",
    "@": ".--.-."
};


// ==========================================================
// NORMALIZACION DEL TEXTO
// ==========================================================

function normalizarTexto(texto) {

    texto = String(texto);

    let resultado = "";


    for (const caracter of texto) {

        // --------------------------------------------------
        // A
        // --------------------------------------------------

        if (
            caracter === "á" ||
            caracter === "Á" ||
            caracter === "à" ||
            caracter === "À" ||
            caracter === "â" ||
            caracter === "Â" ||
            caracter === "ä" ||
            caracter === "Ä"
        ) {

            resultado += "A";
        }


        // --------------------------------------------------
        // E
        // --------------------------------------------------

        else if (
            caracter === "é" ||
            caracter === "É" ||
            caracter === "è" ||
            caracter === "È" ||
            caracter === "ê" ||
            caracter === "Ê" ||
            caracter === "ë" ||
            caracter === "Ë"
        ) {

            resultado += "E";
        }


        // --------------------------------------------------
        // I
        // --------------------------------------------------

        else if (
            caracter === "í" ||
            caracter === "Í" ||
            caracter === "ì" ||
            caracter === "Ì" ||
            caracter === "î" ||
            caracter === "Î" ||
            caracter === "ï" ||
            caracter === "Ï"
        ) {

            resultado += "I";
        }


        // --------------------------------------------------
        // O
        // --------------------------------------------------

        else if (
            caracter === "ó" ||
            caracter === "Ó" ||
            caracter === "ò" ||
            caracter === "Ò" ||
            caracter === "ô" ||
            caracter === "Ô" ||
            caracter === "ö" ||
            caracter === "Ö"
        ) {

            resultado += "O";
        }


        // --------------------------------------------------
        // U
        // --------------------------------------------------

        else if (
            caracter === "ú" ||
            caracter === "Ú" ||
            caracter === "ù" ||
            caracter === "Ù" ||
            caracter === "û" ||
            caracter === "Û" ||
            caracter === "ü" ||
            caracter === "Ü"
        ) {

            resultado += "U";
        }


        // --------------------------------------------------
        // Ñ
        // --------------------------------------------------
        //
        // IMPORTANTE:
        //
        // No utilizamos normalize("NFD") antes de esto.
        //
        // Si lo hicieramos:
        //
        // ñ
        //
        // podria convertirse internamente en:
        //
        // n + ~
        //
        // y al eliminar el acento terminariamos con N.
        //
        // Queremos mantener Ñ porque el proyecto
        // la representa como --.--.
        // --------------------------------------------------

        else if (
            caracter === "ñ" ||
            caracter === "Ñ"
        ) {

            resultado += "Ñ";
        }


        // --------------------------------------------------
        // RESTO
        // --------------------------------------------------

        else {

            resultado += caracter.toUpperCase();
        }
    }


    return resultado;
}


// ==========================================================
// TEXTO -> MORSE
// ==========================================================

function textoAMorse(texto) {

    const normalizado = normalizarTexto(
        texto
    );

    const partes = [];

    const invalidos = [];


    for (const caracter of normalizado) {

        // --------------------------------------------------
        // ESPACIO ENTRE PALABRAS
        // --------------------------------------------------

        if (caracter === " ") {

            // Evitamos generar varios "/" consecutivos.

            if (
                partes.length > 0 &&
                partes[partes.length - 1] !== "/"
            ) {

                partes.push("/");
            }
        }


        // --------------------------------------------------
        // CARACTER SOPORTADO
        // --------------------------------------------------

        else if (
            DICCIONARIO_MORSE[caracter]
        ) {

            partes.push(
                DICCIONARIO_MORSE[
                    caracter
                ]
            );
        }


        // --------------------------------------------------
        // CARACTER NO SOPORTADO
        // --------------------------------------------------

        else {

            invalidos.push(
                caracter
            );
        }
    }


    // ------------------------------------------------------
    // Evitamos terminar un mensaje con "/"
    // si el usuario escribio espacios al final.
    // ------------------------------------------------------

    if (
        partes.length > 0 &&
        partes[partes.length - 1] === "/"
    ) {

        partes.pop();
    }


    return {

        // Texto tal como lo interpreta el traductor.
        textoNormalizado: normalizado,

        // Traduccion Morse.
        codigo: partes.join(" "),

        // Caracteres que no pudieron traducirse.
        invalidos: invalidos
    };
}


// ==========================================================
// VALIDAR TEXTO
// ==========================================================

function textoEsValido(texto) {

    const resultado = textoAMorse(
        texto
    );

    return (
        resultado.invalidos.length === 0
    );
}


// ==========================================================
// OBTENER INVALIDOS
// ==========================================================

function obtenerCaracteresInvalidos(texto) {

    const resultado = textoAMorse(
        texto
    );

    return resultado.invalidos;
}


// ==========================================================
// REPRODUCCION MORSE
// ==========================================================

async function reproducirMorse(
    codigo,
    unidad = 150,
    frecuencia = 800
) {

    if (!codigo) {

        return;
    }


    // ------------------------------------------------------
    // Crear contexto de audio
    // ------------------------------------------------------

    const contexto = new (
        window.AudioContext ||
        window.webkitAudioContext
    )();


    let cursor = (
        contexto.currentTime
        + 0.08
    );


    const segundosUnidad = (
        unidad / 1000
    );


    // ======================================================
    // FUNCION INTERNA PARA PRODUCIR UN TONO
    // ======================================================

    const sonar = (
        duracionUnidades
    ) => {

        const oscilador = (
            contexto.createOscillator()
        );

        const ganancia = (
            contexto.createGain()
        );


        // --------------------------------------------------
        // Frecuencia utilizada por el proyecto:
        //
        // 800 Hz
        // --------------------------------------------------

        oscilador.frequency.value = (
            frecuencia
        );


        // --------------------------------------------------
        // Pequeño fade para evitar clicks fuertes al
        // encender y apagar el oscilador.
        // --------------------------------------------------

        ganancia.gain.setValueAtTime(
            0.0001,
            cursor
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.18,
            cursor + 0.01
        );

        ganancia.gain.setValueAtTime(
            0.18,
            cursor
            +
            duracionUnidades
            *
            segundosUnidad
            -
            0.01
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.0001,
            cursor
            +
            duracionUnidades
            *
            segundosUnidad
        );


        oscilador
            .connect(ganancia)
            .connect(contexto.destination);


        oscilador.start(
            cursor
        );


        oscilador.stop(
            cursor
            +
            duracionUnidades
            *
            segundosUnidad
        );


        cursor += (
            duracionUnidades
            *
            segundosUnidad
        );
    };


    // ======================================================
    // RECORRER CODIGO MORSE
    // ======================================================

    for (const simbolo of codigo) {

        // --------------------------------------------------
        // PUNTO
        //
        // 1 unidad
        // --------------------------------------------------

        if (simbolo === ".") {

            sonar(1);

            // Separacion entre simbolos.

            cursor += (
                segundosUnidad
            );
        }


        // --------------------------------------------------
        // RAYA
        //
        // 3 unidades
        // --------------------------------------------------

        else if (simbolo === "-") {

            sonar(3);

            // Separacion entre simbolos.

            cursor += (
                segundosUnidad
            );
        }


        // --------------------------------------------------
        // ESPACIO ENTRE LETRAS
        // --------------------------------------------------
        //
        // Punto/raya ya dejo una unidad.
        // Agregamos dos mas.
        // --------------------------------------------------

        else if (simbolo === " ") {

            cursor += (
                segundosUnidad * 2
            );
        }


        // --------------------------------------------------
        // ESPACIO ENTRE PALABRAS
        // --------------------------------------------------
        //
        // Se agregan unidades adicionales para hacer
        // claramente perceptible la separacion.
        // --------------------------------------------------

        else if (simbolo === "/") {

            cursor += (
                segundosUnidad * 4
            );
        }
    }


    // ======================================================
    // ESPERAR A QUE TERMINE EL AUDIO
    // ======================================================

    const espera = Math.max(

        0,

        (
            cursor
            -
            contexto.currentTime
        )
        *
        1000
        +
        100
    );


    await new Promise(

        resolve => setTimeout(
            resolve,
            espera
        )
    );


    await contexto.close();
}
