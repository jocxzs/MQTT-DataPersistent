// src/services/mqttService.js
import mqtt from 'mqtt';

let client = null;
let listeners = {};

/**
 * Conecta ao broker MQTT via WebSocket.
 * O broker precisa suportar WebSocket (porta padrão 9001 para Mosquitto).
 *
 * @param {string} brokerUrl  - ex: 'ws://192.168.1.100:9001'
 * @param {object} options    - opções opcionais (clientId, username, password)
 * @param {function} onConnect   - callback chamado quando conectado
 * @param {function} onError     - callback chamado em caso de erro
 */
export function connectMQTT(brokerUrl, options = {}, onConnect, onError) {
  if (client) {
    client.end(true);
  }

  const clientId = options.clientId || `rn_client_${Math.random().toString(16).slice(2, 8)}`;

  client = mqtt.connect(brokerUrl, {
    clientId,
    username: options.username || undefined,
    password: options.password || undefined,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    clean: true,
  });

  client.on('connect', () => {
    console.log('[MQTT] Conectado ao broker:', brokerUrl);
    if (onConnect) onConnect();
  });

  client.on('error', (err) => {
    console.error('[MQTT] Erro:', err.message);
    if (onError) onError(err);
  });

  client.on('message', (topic, message) => {
    const payload = message.toString();
    console.log(`[MQTT] Mensagem recebida | Tópico: ${topic} | Payload: ${payload}`);

    // Notifica todos os listeners registrados para o tópico
    if (listeners[topic]) {
      listeners[topic].forEach((cb) => cb(topic, payload));
    }

    // Notifica listeners curinga '*'
    if (listeners['*']) {
      listeners['*'].forEach((cb) => cb(topic, payload));
    }
  });

  client.on('offline', () => {
    console.warn('[MQTT] Cliente offline. Tentando reconectar...');
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Tentando reconectar...');
  });
}

/**
 * Inscreve em um tópico MQTT.
 * @param {string} topic
 * @param {function} callback - função (topic, payload) => void
 */
export function subscribeTopic(topic, callback) {
  if (!client) return;

  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[MQTT] Erro ao inscrever no tópico ${topic}:`, err.message);
    } else {
      console.log(`[MQTT] Inscrito no tópico: ${topic}`);
    }
  });

  if (!listeners[topic]) {
    listeners[topic] = [];
  }
  listeners[topic].push(callback);
}

/**
 * Remove inscrição de um tópico.
 * @param {string} topic
 */
export function unsubscribeTopic(topic) {
  if (!client) return;
  client.unsubscribe(topic);
  delete listeners[topic];
}

/**
 * Publica uma mensagem em um tópico.
 * @param {string} topic
 * @param {string} message
 */
export function publishMessage(topic, message) {
  if (!client) return;
  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error('[MQTT] Erro ao publicar:', err.message);
    } else {
      console.log(`[MQTT] Publicado | Tópico: ${topic} | Msg: ${message}`);
    }
  });
}

/**
 * Retorna se o cliente está conectado.
 */
export function isConnected() {
  return client ? client.connected : false;
}

/**
 * Desconecta o cliente MQTT.
 */
export function disconnectMQTT() {
  if (client) {
    client.end();
    client = null;
    listeners = {};
    console.log('[MQTT] Desconectado.');
  }
}