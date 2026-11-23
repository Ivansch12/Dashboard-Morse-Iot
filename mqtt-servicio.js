class ServicioMqttWeb {
  constructor() {
    this.cliente = null;
    this.usuario = '';
    this.conectado = false;
    this.alMensaje = null;
    this.alEstado = null;
  }

  topico(feed) {
    return `${this.usuario}/feeds/${feed}`;
  }

  conectar(usuario, aioKey) {
    return new Promise((resolve, reject) => {
      this.desconectar();
      this.usuario = usuario.trim();

      const clientId = `web-morse-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      this.cliente = mqtt.connect('wss://io.adafruit.com:443/mqtt', {
        username: this.usuario,
        password: aioKey,
        clientId,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 15000,
        keepalive: 60
      });

      const alErrorInicial = error => {
        this.alEstado?.('error', error.message || 'No fue posible conectar');
        reject(error);
      };

      this.cliente.once('error', alErrorInicial);

      this.cliente.on('connect', () => {
        this.cliente.removeListener('error', alErrorInicial);
        this.conectado = true;
        this.alEstado?.('conectado');

        const topicos = [
          this.topico('morse-texto-local'),
          this.topico('morse-codigo-local'),
          this.topico('morse-estado')
        ];

        this.cliente.subscribe(topicos, { qos: 0 }, error => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });

      this.cliente.on('message', (topico, payload) => {
        const feed = topico.split('/').pop();
        this.alMensaje?.(feed, payload.toString());
      });

      this.cliente.on('reconnect', () => this.alEstado?.('reconectando'));
      this.cliente.on('offline', () => {
        this.conectado = false;
        this.alEstado?.('desconectado');
      });
      this.cliente.on('close', () => {
        this.conectado = false;
        this.alEstado?.('desconectado');
      });
      this.cliente.on('error', error => this.alEstado?.('error', error.message));
    });
  }

  publicar(feed, valor) {
    return new Promise((resolve, reject) => {
      if (!this.cliente || !this.conectado) {
        reject(new Error('MQTT no está conectado'));
        return;
      }
      this.cliente.publish(this.topico(feed), String(valor), { qos: 0 }, error => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  desconectar() {
    if (this.cliente) {
      this.cliente.end(true);
      this.cliente = null;
    }
    this.conectado = false;
  }
}
