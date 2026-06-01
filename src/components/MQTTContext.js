import React, { createContext, useState, useEffect, useContext } from 'react';
import mqtt from 'mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MQTTContext = createContext(null);

export const MQTTProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentMessage, setCurrentMessage] = useState({});
  const [history, setHistory] = useState([]); // Estado para armazenar o histórico de leituras

  const config = {
    host: 'broker.hivemq.com',
    port: 8000,
    clientId: `rn_mqtt_${Math.random().toString(16).substr(2, 8)}`,
  };

  // 1. Carregar o histórico do AsyncStorage ao iniciar o App
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('@mqtt_history');
        if (savedHistory !== null) {
          setHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error("Erro ao carregar histórico local:", error);
      }
    };
    loadHistory();
  }, []);

  // 2. Função auxiliar para salvar o histórico no dispositivo
  const saveToStorage = async (newHistory) => {
    try {
      await AsyncStorage.setItem('@mqtt_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error("Erro ao salvar dado localmente:", error);
    }
  };

  useEffect(() => {
    const mqttUrl = `ws://${config.host}:${config.port}/mqtt`;
    const mqttClient = mqtt.connect(mqttUrl, {
      clientId: config.clientId,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      clean: true,
    });

    mqttClient.on('connect', () => {
      setIsConnected(true);
      setClient(mqttClient);
    });

    mqttClient.on('reconnect', () => {
      console.log('[MQTTContext] reconnecting');
    });

    mqttClient.on('offline', () => {
      setIsConnected(false);
    });

    mqttClient.on('error', (error) => {
      console.error('[MQTTContext] MQTT error:', error);
    });

    mqttClient.on('message', (topic, message) => {
      const payload = message.toString();
      const timestamp = new Date().toLocaleTimeString();

      setCurrentMessage({ topic, payload });

      setHistory((prevHistory) => {
        const updatedHistory = [{ topic, payload, timestamp }, ...prevHistory].slice(0, 50);
        saveToStorage(updatedHistory);
        return updatedHistory;
      });
    });

    return () => {
      if (mqttClient) {
        mqttClient.end(true);
      }
    };
  }, []);

  // Função para limpar o histórico (Útil para colocar na ConfigScreen)
  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('@mqtt_history');
      setHistory([]);
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
    }
  };

  const subscribe = (topic) => {
    if (client && isConnected) client.subscribe(topic);
  };

  return (
    <MQTTContext.Provider value={{ isConnected, currentMessage, history, subscribe, clearHistory }}>
      {children}
    </MQTTContext.Provider>
  );
};

export const useMQTT = () => useContext(MQTTContext);