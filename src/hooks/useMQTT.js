// src/hooks/useMQTT.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { connectMQTT, subscribeTopic, unsubscribeTopic, publishMessage, disconnectMQTT, isConnected,
} from '../services/mqttservices';
import { saveMessage, getMessages, getTopics, saveTopics, getConfig, saveConfig } from '../services/storageservice';

export function useMQTT() {
  const [status, setStatus] = useState('disconnected');
  const [errorMsg, setErrorMsg] = useState(null);
  const [topics, setTopics] = useState([]);
  const [messages, setMessages] = useState({});
  const [lastValues, setLastValues] = useState({}); 
  const [config, setConfig] = useState(null);
  const subscribedTopics = useRef(new Set());

  // Carrega configuração e tópicos salvos ao iniciar
  useEffect(() => {
    (async () => {
      const savedConfig = await getConfig();
      const savedTopics = await getTopics();

      if (savedConfig) setConfig(savedConfig);
      setTopics(savedTopics);

      // Carrega histórico local de cada tópico
      const history = {};
      for (const t of savedTopics) {
        history[t] = await getMessages(t);
      }
      setMessages(history);
    })();

    return () => {
      disconnectMQTT();
    };
  }, []);

  // Mensagem MQTT
  const handleMessage = useCallback(async (topic, payload) => {
    const saved = await saveMessage(topic, payload);
    if (!saved) return;

    setLastValues((prev) => ({
      ...prev,
      [topic]: { payload, timestamp: saved.timestamp, numericValue: saved.numericValue },
    }));

    setMessages((prev) => ({
      ...prev,
      [topic]: [saved, ...(prev[topic] || [])].slice(0, 200),
    }));
  }, []);

  // Conecta ao broker
  const connect = useCallback(
    async (brokerUrl, options = {}) => {
      setStatus('connecting');
      setErrorMsg(null);

      const newConfig = { brokerUrl, ...options };
      await saveConfig(newConfig);
      setConfig(newConfig);

      connectMQTT(
        brokerUrl,
        options,
        () => {
          setStatus('connected');
          // Re-inscreve nos tópicos salvos
          topics.forEach((t) => {
            if (!subscribedTopics.current.has(t)) {
              subscribeTopic(t, handleMessage);
              subscribedTopics.current.add(t);
            }
          });
        },
        (err) => {
          setStatus('error');
          setErrorMsg(err.message || 'Erro de conexão');
        }
      );
    },
    [topics, handleMessage]
  );

  // Desconecta
  const disconnect = useCallback(() => {
    disconnectMQTT();
    subscribedTopics.current.clear();
    setStatus('disconnected');
  }, []);

  // Adiciona novo tópico
  const addTopic = useCallback(
    async (topic) => {
      if (!topic || topics.includes(topic)) return;
      const newTopics = [...topics, topic];
      setTopics(newTopics);
      await saveTopics(newTopics);

      if (isConnected() && !subscribedTopics.current.has(topic)) {
        subscribeTopic(topic, handleMessage);
        subscribedTopics.current.add(topic);
      }

      // Carrega histórico do novo tópico
      const history = await getMessages(topic);
      setMessages((prev) => ({ ...prev, [topic]: history }));
    },
    [topics, handleMessage]
  );

  // Remove tópico
  const removeTopic = useCallback(
    async (topic) => {
      const newTopics = topics.filter((t) => t !== topic);
      setTopics(newTopics);
      await saveTopics(newTopics);

      unsubscribeTopic(topic);
      subscribedTopics.current.delete(topic);

      setMessages((prev) => {
        const next = { ...prev };
        delete next[topic];
        return next;
      });
      setLastValues((prev) => {
        const next = { ...prev };
        delete next[topic];
        return next;
      });
    },
    [topics]
  );

  // Publica mensagem
  const publish = useCallback((topic, payload) => {
    publishMessage(topic, payload);
  }, []);

  return {status, errorMsg, topics, messages, lastValues, config, connect, disconnect, addTopic, removeTopic, publish,};
}