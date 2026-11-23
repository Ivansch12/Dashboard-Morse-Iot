# Dashboard Traductor Morse IoT

Dashboard web estático para el proyecto ESP32-C3 + Adafruit IO.

## Ejecutar localmente

El navegador debe servir los archivos por HTTP. Desde la carpeta del proyecto:

```bash
python3 -m http.server 8080
```

Luego abrir `http://localhost:8080`.

## Credenciales

La interfaz solicita el usuario y la AIO Key de Adafruit IO. Las credenciales se guardan únicamente en `sessionStorage`, por lo que se eliminan al cerrar la sesión/pestaña del navegador.

## Feeds esperados

- `morse-texto-remoto`: web hacia ESP32.
- `morse-texto-local`: ESP32 hacia web.
- `morse-codigo-local`: Morse generado por ESP32.
- `morse-estado`: `1` indica que la placa reportó conexión.

## Publicación

Puede publicarse como sitio estático en GitHub Pages, Cloudflare Pages o cualquier servidor web.
