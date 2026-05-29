// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  MESSAGES: '@mqtt_messages',
  CONFIG: '@mqtt_config',
  TOPICS: '@mqtt_topics',
};

const MAX_MESSAGES_PER_TOPIC = 200; // Limite de histórico por tópico

/**
 * Salva uma mensagem recebida do MQTT no histórico local.
 * @param {string} topic
 * @param {string} payload
 */
export async function saveMessage(topic, payload) {
  try {
    const key = `${STORAGE_KEYS.MESSAGES}_${sanitizeKey(topic)}`;
    const existing = await AsyncStorage.getItem(key);
    const messages = existing ? JSON.parse(existing) : [];

    const newMessage = {
      id: Date.now().toString(),
      topic,
      payload,
      timestamp: new Date().toISOString(),
      numericValue: extractNumericValue(payload),
    };

    // Adiciona no início (mais recente primeiro)
    messages.unshift(newMessage);

    // Limita o histórico para não encher o storage
    const trimmed = messages.slice(0, MAX_MESSAGES_PER_TOPIC);

    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
    return newMessage;
  } catch (error) {
    console.error('[Storage] Erro ao salvar mensagem:', error);
    return null;
  }
}

/**
 * Busca o histórico de mensagens de um tópico.
 * @param {string} topic
 * @returns {Array}
 */
export async function getMessages(topic) {
  try {
    const key = `${STORAGE_KEYS.MESSAGES}_${sanitizeKey(topic)}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Storage] Erro ao buscar mensagens:', error);
    return [];
  }
}

/**
 * Limpa o histórico de um tópico específico.
 * @param {string} topic
 */
export async function clearMessages(topic) {
  try {
    const key = `${STORAGE_KEYS.MESSAGES}_${sanitizeKey(topic)}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('[Storage] Erro ao limpar mensagens:', error);
  }
}

/**
 * Salva a configuração do broker MQTT.
 * @param {object} config - { brokerUrl, username, password, topics }
 */
export async function saveConfig(config) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('[Storage] Erro ao salvar configuração:', error);
  }
}

/**
 * Busca a configuração salva do broker MQTT.
 * @returns {object|null}
 */
export async function getConfig() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Storage] Erro ao buscar configuração:', error);
    return null;
  }
}

/**
 * Salva a lista de tópicos monitorados.
 * @param {Array<string>} topics
 */
export async function saveTopics(topics) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  } catch (error) {
    console.error('[Storage] Erro ao salvar tópicos:', error);
  }
}

/**
 * Busca os tópicos salvos.
 * @returns {Array<string>}
 */
export async function getTopics() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TOPICS);
    return data
      ? JSON.parse(data)
      : ['sensor/temperatura', 'sensor/umidade', 'sensor/luminosidade'];
  } catch (error) {
    console.error('[Storage] Erro ao buscar tópicos:', error);
    return ['sensor/temperatura', 'sensor/umidade', 'sensor/luminosidade'];
  }
}

/**
 * Retorna estatísticas de um tópico (min, max, média dos últimos N registros).
 * @param {string} topic
 * @param {number} limit
 */
export async function getTopicStats(topic, limit = 50) {
  const messages = await getMessages(topic);
  const recent = messages.slice(0, limit);
  const numericValues = recent
    .map((m) => m.numericValue)
    .filter((v) => v !== null && !isNaN(v));

  if (numericValues.length === 0) {
    return { min: null, max: null, avg: null, count: recent.length };
  }

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    count: recent.length,
  };
}

// --- Utilitários Internos ---

function sanitizeKey(topic) {
  // Substitui caracteres inválidos para usar como chave AsyncStorage
  return topic.replace(/[^a-zA-Z0-9]/g, '_');
}

function extractNumericValue(payload) {
  // Tenta extrair um número do payload (ex: "23.5", "{"value":23.5}", "Temp: 23.5°C")
  if (!payload) return null;

  // Tenta JSON
  try {
    const parsed = JSON.parse(payload);
    if (typeof parsed === 'number') return parsed;
    if (typeof parsed === 'object') {
      const firstNum = Object.values(parsed).find(
        (v) => typeof v === 'number'
      );
      if (firstNum !== undefined) return firstNum;
    }
  } catch (_) {}

  // Tenta extrair número da string
  const match = payload.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}