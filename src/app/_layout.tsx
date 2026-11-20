import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import { getDb } from '../lib/db';
import { CycleProvider } from '../lib/cycleStore';

// Bloqueio por biometria (ou senha do aparelho como alternativa).
async function unlockApp(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !enrolled) return true; // sem bloqueio disponível no aparelho
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear Meu ciclo',
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar senha do aparelho',
    disableDeviceFallback: false,
  });
  return result.success;
}

export default function RootLayout() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  const tryUnlock = async () => {
    const ok = await unlockApp();
    setUnlocked(ok);
    if (!ok) Alert.alert('Não foi possível desbloquear');
  };

  useEffect(() => {
    getDb().then(tryUnlock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (unlocked === null) {
    return <SafeAreaView style={styles.center}><StatusBar style="dark" /></SafeAreaView>;
  }

  if (!unlocked) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="dark" />
        <View style={styles.lockBox}>
          <Text style={styles.lockTitle}>Meu ciclo</Text>
          <Pressable style={styles.button} onPress={tryUnlock}>
            <Text style={styles.buttonText}>Desbloquear</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CycleProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#D9485F',
          tabBarInactiveTintColor: '#9A90A3',
          headerTintColor: '#2B2233',
          headerTitleStyle: { color: '#2B2233', fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Hoje' }} />
        <Tabs.Screen name="calendario" options={{ title: 'Calendário' }} />
        <Tabs.Screen name="sintomas" options={{ title: 'Sintomas' }} />
        <Tabs.Screen name="configuracoes" options={{ title: 'Configurações' }} />
      </Tabs>
    </CycleProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  lockBox: { alignItems: 'center', gap: 20 },
  lockTitle: { fontSize: 22, fontWeight: '600', color: '#2B2233' },
  button: { backgroundColor: '#D9485F', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
