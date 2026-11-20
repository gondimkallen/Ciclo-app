import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { addDays, format, parseISO } from 'date-fns';
import { addCycleStart, deleteCycleStart, listCycleStarts } from './db';
import { Prediction, predictCycle } from './prediction';
import { Settings, DEFAULT_SETTINGS, loadSettings, saveSetting } from './settings';
import { daysWithSymptoms } from './symptoms';
import {
  requestNotificationPermission,
  scheduleDiscreetReminders,
  cancelReminders,
} from './notifications';

type CycleState = {
  ready: boolean;
  cycleStarts: string[];
  periodDays: string[];
  prediction: Prediction | null;
  symptomDays: string[];
  settings: Settings;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  refresh: () => Promise<void>;
  toggleStart: (day: string) => Promise<void>;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  setReminders: (on: boolean) => Promise<boolean>;
};

const CycleContext = createContext<CycleState | null>(null);

const TODAY = () => format(new Date(), 'yyyy-MM-dd');

/** Estado único do app: ciclos, previsão, sintomas e configurações, lidos do SQLite local. */
export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cycleStarts, setCycleStarts] = useState<string[]>([]);
  const [periodDays, setPeriodDays] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [symptomDays, setSymptomDays] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [selectedDay, setSelectedDay] = useState(TODAY());

  const refresh = useCallback(async () => {
    const s = await loadSettings();
    const rows = await listCycleStarts();

    const days: string[] = [];
    rows.forEach((r) => {
      const start = parseISO(r.startDate);
      const end = r.endDate ? parseISO(r.endDate) : addDays(start, s.periodLength - 1);
      for (let d = start; d <= end; d = addDays(d, 1)) days.push(format(d, 'yyyy-MM-dd'));
    });

    const p = predictCycle(
      rows.map((r) => ({ startDate: r.startDate })),
      [],
      { cycle: s.cycleLength, period: s.periodLength }
    );

    setSettings(s);
    setCycleStarts(rows.map((r) => r.startDate));
    setPeriodDays(days);
    setPrediction(p);
    setSymptomDays(await daysWithSymptoms());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Lembretes: agenda sempre que a previsão muda e os lembretes estão ligados
  useEffect(() => {
    if (!ready || !settings.remindersOn || !prediction) return;
    scheduleDiscreetReminders([prediction.fertileWindow.from, prediction.nextPeriod.from]);
  }, [ready, settings.remindersOn, prediction]);

  const toggleStart = useCallback(
    async (day: string) => {
      if (cycleStarts.includes(day)) await deleteCycleStart(day);
      else await addCycleStart(day);
      await refresh();
    },
    [cycleStarts, refresh]
  );

  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      await saveSetting(key, value);
      await refresh();
    },
    [refresh]
  );

  const setReminders = useCallback(
    async (on: boolean) => {
      if (on) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert('Permissão negada', 'Ative as notificações nas configurações do aparelho.');
          return false;
        }
      } else {
        await cancelReminders();
      }
      await saveSetting('remindersOn', on);
      await refresh();
      return true;
    },
    [refresh]
  );

  const value = useMemo<CycleState>(
    () => ({
      ready,
      cycleStarts,
      periodDays,
      prediction,
      symptomDays,
      settings,
      selectedDay,
      setSelectedDay,
      refresh,
      toggleStart,
      updateSetting,
      setReminders,
    }),
    [ready, cycleStarts, periodDays, prediction, symptomDays, settings, selectedDay, refresh, toggleStart, updateSetting, setReminders]
  );

  return <CycleContext.Provider value={value}>{children}</CycleContext.Provider>;
}

export function useCycle(): CycleState {
  const ctx = useContext(CycleContext);
  if (!ctx) throw new Error('useCycle precisa estar dentro de CycleProvider');
  return ctx;
}
