import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button } from 'react-native';
import { useMQTT } from './MQTTContext';

export default function DashboardScreen({ navigation }) {
  const { isConnected, history, subscribe } = useMQTT();

  useEffect(() => {
    if (isConnected) {
      subscribe('esp32/sensor/temperatura'); // Altere para o tópico que usará no MQTT.fx
    }
  }, [isConnected]);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        Status: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      </Text>

      <Text style={styles.title}>Histórico de Leituras (Salvo Localmente):</Text>
      
      <FlatList
        data={history}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardText}>Tópico: {item.topic}</Text>
            <Text style={styles.cardValue}>Valor: {item.payload}</Text>
            <Text style={styles.cardTime}>Hora: {item.timestamp}</Text>
          </View>
        )}
      />

      <Button 
        title="Configurações do App" 
        onPress={() => navigation.navigate('Config')} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  status: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  cardText: { fontSize: 14, color: '#666' },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#000', marginVertical: 4 },
  cardTime: { fontSize: 12, color: '#999', textAlign: 'right' }
});