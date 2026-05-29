// src/screens/ConfigScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { View, Text,TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MQTTContext } from '../context/MQTTContext';

export default function ConfigScreen() {
  const { status, errorMsg, config, connect, disconnect } = useContext(MQTTContext);

  const [brokerIp, setBrokerIp] = useState('');
  const [brokerPort, setBrokerPort] = useState('9001');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (config?.brokerUrl) {
      // Extrai IP e porta da URL salva
      try {
        const url = new URL(config.brokerUrl);
        setBrokerIp(url.hostname);
        setBrokerPort(url.port || '9001');
        setBrokerIp(url.hostname);
      } catch (_) {}
      setUsername(config.username || '');
    }
  }, [config]);

  const handleConnect = () => {
    if (!brokerIp.trim()) {
      Alert.alert('Erro', 'Informe o endereço IP do broker MQTT.');
      return;
    }
    const brokerUrl = `ws://${brokerIp.trim()}:${brokerPort.trim()}`;
    connect(brokerUrl, {
      username: username.trim() || undefined,
      password: password.trim() || undefined,
    });
  };

  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  const statusConfig = {
    connected: { label: 'Conectado', color: '#4ADE80', icon: 'checkmark-circle' },
    connecting: { label: 'Conectando...', color: '#FFD54F', icon: 'sync-outline' },
    error: { label: 'Erro de Conexão', color: '#FF6B6B', icon: 'alert-circle' },
    disconnected: { label: 'Desconectado', color: '#4A5568', icon: 'radio-outline' },
  };

  const currentStatus = statusConfig[status] || statusConfig.disconnected;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configurar Broker</Text>
          <Text style={styles.subtitle}>Conexão MQTT via WebSocket</Text>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: currentStatus.color + '40' }]}>
          <Ionicons name={currentStatus.icon} size={24} color={currentStatus.color} />
          <View style={styles.statusTextBlock}>
            <Text style={[styles.statusLabel, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
            {isConnected && config?.brokerUrl && (
              <Text style={styles.statusUrl}>{config.brokerUrl}</Text>
            )}
            {status === 'error' && errorMsg && (
              <Text style={styles.statusError}>{errorMsg}</Text>
            )}
          </View>
        </View>

        {/* Campos de configuração */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Endereço do Broker</Text>

          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 2 }]}>
              <Text style={styles.label}>IP / Host</Text>
              <TextInput
                style={styles.input}
                placeholder="192.168.1.100"
                placeholderTextColor="#2A3550"
                value={brokerIp}
                onChangeText={setBrokerIp}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Porta WS</Text>
              <TextInput
                style={styles.input}
                placeholder="9001"
                placeholderTextColor="#2A3550"
                value={brokerPort}
                onChangeText={setBrokerPort}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={styles.hint}>
            <Ionicons name="information-circle-outline" size={12} color="#4A5568" />
            {' '}O Mosquitto precisa do listener WebSocket ativo (porta 9001 por padrão).
          </Text>
        </View>

        {/* Credenciais opcionais */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Autenticação (Opcional)</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={styles.input}
              placeholder="Deixe vazio se não necessário"
              placeholderTextColor="#2A3550"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Deixe vazio se não necessário"
                placeholderTextColor="#2A3550"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#4A5568"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Botões */}
        {isConnected ? (
          <TouchableOpacity onPress={disconnect} style={styles.disconnectBtn}>
            <Ionicons name="power-outline" size={18} color="#FF6B6B" />
            <Text style={styles.disconnectBtnText}>Desconectar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleConnect}
            disabled={isConnecting}
            style={styles.connectBtnWrapper}
          >
            <LinearGradient
              colors={isConnecting ? ['#1A2A3A', '#1A2A3A'] : ['#4FC3F7', '#0288D1']}
              style={styles.connectBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isConnecting ? (
                <ActivityIndicator color="#4FC3F7" size="small" />
              ) : (
                <Ionicons name="flash-outline" size={18} color="#fff" />
              )}
              <Text style={styles.connectBtnText}>
                {isConnecting ? 'Conectando...' : 'Conectar ao Broker'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Dica de configuração Mosquitto */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>
            <Ionicons name="code-slash-outline" size={14} color="#4FC3F7" /> Config Mosquitto
          </Text>
          <Text style={styles.tipCode}>
            {`# /etc/mosquitto/mosquitto.conf\nlistener 1883\nlistener 9001\nprotocol websockets\nallow_anonymous true`}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A' },
  content: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#4FC3F7', marginTop: 4, letterSpacing: 0.5 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  statusTextBlock: { flex: 1 },
  statusLabel: { fontWeight: '700', fontSize: 15 },
  statusUrl: { color: '#4A5568', fontSize: 12, marginTop: 2 },
  statusError: { color: '#FF6B6B', fontSize: 12, marginTop: 2 },
  card: {
    backgroundColor: '#0D1B2A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A2A3A',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  row: { flexDirection: 'row' },
  inputWrapper: { marginBottom: 12 },
  label: { fontSize: 12, color: '#4A6080', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#0A0E1A',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1A2A3A',
    fontSize: 15,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { padding: 12, marginLeft: 4 },
  hint: { fontSize: 11, color: '#4A5568', lineHeight: 18 },
  connectBtnWrapper: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FF6B6B40',
    backgroundColor: 'rgba(255,107,107,0.08)',
    gap: 8,
    marginBottom: 16,
  },
  disconnectBtnText: { color: '#FF6B6B', fontWeight: '700', fontSize: 16 },
  tipCard: {
    backgroundColor: '#071015',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0D2030',
  },
  tipTitle: { color: '#4FC3F7', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  tipCode: {
    color: '#4ADE80',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
});