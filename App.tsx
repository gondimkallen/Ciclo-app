import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, Text, Pressable, StyleSheet, View, Alert, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CycleCalendar from './src/components/CycleCalendar';
import SymptomPanel from './src/components/SymptomPanel';
import { predictCycle, CycleRecord, Prediction } from './src/lib/prediction';
import { getDb, listCycleStarts, addCycleStart, deleteCycleStart } from './src/lib/db';
import { SymptomEntry, listSymptoms, daysWithSymptoms } from './src/lib/symptoms';
import {
  requestNotificationPermission,
  scheduleDiscreetReminders,
  cancelReminders,
} from './src/lib/notifications';

const TODAY = () => format(new Date(), 'yyyy-MM-dd');
const DEFAULT_PERIOD_DAYS = 5;

// Bloqueio por biometria (ou senha do aparelho como alternativa).
async function unlockApp(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !enrolled) return true; // sem bloqueio disponível no aparelho
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear',
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar senha do aparelho',
    disableDeviceFallback: false,
  });
  return result.success;
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [cycleStarts, setCycleStarts] = useState<string[]>([]);
  const [cycles, setCycles] = useState<CycleRecord[]>([]);
  const [periodDays, setPeriodDays] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [selectedDay, setSelectedDay] = useState(TODAY());
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [symptomDays, setSymptomDays] = useState<string[]>([]);
  const [remindersOn, setRemindersOn] = useState(false);

  const refresh = useCallback(async () => {
    const rows = await listCycleStarts();
    const starts = rows.map((r) => r.startDate);
    setCycleStarts(starts);
    setCycles(rows.map((r) => ({ startDate: r.startDate })));

    const days: string[] = [];
    rows.forEach((r) => {
      const start = parseISO(r.startDate);
      const end = r.endDate ? parseISO(r.endDate) : addDays(start, DEFAULT_PERIOD_DAYS - 1);
      for (let d = start; d <= end; d = addDays(d, 1)) days.push(format(d, 'yyyy-MM-dd'));
    });
    setPeriodDays(days);

    const p = predictCycle(rows.map((r) => ({ startDate: r.startDate })));
    setPrediction(p);

    setEntries(await listSymptoms(selectedDay));
    setSymptomDays(await daysWithSymptoms());
  }, [selectedDay]);

  useEffect(() => {
    (async () => {
      await getDb();
      const ok = await unlockApp();
      setUnlocked(ok);
      if (ok) await refresh();
    })();
  }, [refresh]);

  // Quando o dia muda, recarrega os sintomas dele
  useEffect(() => {
    if (!unlocked) return;
    listSymptoms(selectedDay).then(setEntries);
  }, [selectedDay, unlocked]);

  const toggleReminders = async (on: boolean) => {
    if (!on) {
      await cancelReminders();
      setRemindersOn(false);
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert('Permissão negada', 'Ative as notificações nas configurações do aparelho.');
      return;
    }
    setRemindersOn(true);
    if (prediction) {
      await scheduleDiscreetReminders([prediction.fertileWindow.from, prediction.nextPeriod.from]);
    }
  };

  // Reagenda lembretes sempre que a previsão mudar e os lembretes estiverem ligados
  useEffect(() => {
    if (remindersOn && prediction) {
      scheduleDiscreetReminders([prediction.fertileWindow.from, prediction.nextPeriod.from]);
    }
  }, [prediction, remindersOn]);

  const selectedIsStart = cycleStarts.includes(selectedDay);
  const isPeriodDay = periodDays.includes(selectedDay);

  if (!unlocked) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar style="dark" />
        <Pressable
          style={styles.button}
          onPress={async () => {
            const ok = await unlockApp();
            if (ok) {
              setUnlocked(true);
              await refresh();
            } else {
              Alert.alert('Não foi possível desbloquear');
            }
          }}
        >
          <Text style={styles.buttonText}>Desbloquear</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <CycleCalendar
          periodDays={periodDays}
          prediction={prediction}
          selectedDay={selectedDay}
          symptomDays={symptomDays}
          onDayPress={setSelectedDay}
        />

        <View style={styles.section}>
          <Text style={styles.dayTitle}>
            {format(parseISO(selectedDay), "d 'de' MMMM", { locale: ptBR })}
            {isPeriodDay ? ' · menstruação' : ''}
          </Text>

          {selectedIsStart ? (
            <Pressable
              style={styles.buttonOutline}
              onPress={async () => {
                await deleteCycleStart(selectedDay);
                await refresh();
              }}
            >
              <Text style={styles.buttonOutlineText}>Remover início de menstruação neste dia</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.button}
              onPress={async () => {
                await addCycleStart(selectedDay);
                await refresh();
              }}
            >
              <Text style={styles.buttonText}>Marcar início de menstruação neste dia</Text>
            </Pressable>
          )}
        </View>

        <SymptomPanel day={selectedDay} entries={entries} onChange={refresh} />

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Lembretes discretos</Text>
            <Switch value={remindersOn} onValueChange={toggleReminders} />
          </View>
          <Text style={styles.hint}>
            As notificações dizem apenas "Lembrete". Nenhum dado de saúde aparece nelas.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  dayTitle: { fontSize: 16, fontWeight: '600', color: '#2B2233', marginBottom: 10, textTransform: 'capitalize' },
  button: {
    backgroundColor: '#D9485F',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#D9485F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonOutlineText: { color: '#D9485F', fontWeight: '600', fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 15, color: '#2B2233', fontWeight: '500' },
  hint: { fontSize: 12, color: '#9A90A3', marginTop: 6, lineHeight: 17 },
});
