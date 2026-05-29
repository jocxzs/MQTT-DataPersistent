import React, { createContext, useState, useEffect, useContext } from 'react';
import init from 'react_native_mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ... (Manter a inicialização do init do Paho MQTT igual ao código anterior)

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
    const mqttClient = new window.Paho.MQTT.Client(config.host, Number(config.port), config.clientId);

    mqttClient.onConnectionLost = (responseObject) => {
      setIsConnected(false);
    };

    mqttClient.onMessageArrived = (message) => {
      const topic = message.destinationName;
      const payload = message.payloadString;
      const timestamp = new Date().toLocaleTimeString(); // Registra o horário da leitura

      setCurrentMessage({ topic, payload });

      // Adiciona a nova leitura ao histórico (limitando aos últimos 50 registros para não estourar a memória)
      setHistory((prevHistory) => {
        const updatedHistory = [{ topic, payload, timestamp }, ...prevHistory].slice(0, 50);
        saveToStorage(updatedHistory); // Salva no AsyncStorage
        return updatedHistory;
      });
    };

    mqttClient.connect({
      onSuccess: () => {
        setIsConnected(true);
        setClient(mqttClient);
      },
      onFailure: () => setIsConnected(false),
      useSSL: false,
    });

    return () => {
      if (mqttClient.isConnected()) mqttClient.disconnect();
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