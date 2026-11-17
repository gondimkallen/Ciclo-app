import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Prediction, isInRange } from '../lib/prediction';

type Props = {
  periodDays: string[]; // dias marcados como menstruação (yyyy-MM-dd)
  prediction: Prediction | null;
  selectedDay?: string;
  symptomDays?: string[];
  onDayPress?: (day: string) => void;
};

const COLORS = {
  period: '#D9485F',
  nextPeriod: '#F4A3B0',
  ovulation: '#7B61C9',
  fertile: '#CDBFEF',
  text: '#2B2233',
  muted: '#9A90A3',
  bg: '#FFFFFF',
};

export default function CycleCalendar({ periodDays, prediction, selectedDay, symptomDays = [], onDayPress }: Props) {
  const [month, setMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const periodSet = useMemo(() => new Set(periodDays), [periodDays]);
  const symptomSet = useMemo(() => new Set(symptomDays), [symptomDays]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => setMonth(addMonths(month, -1))} hitSlop={12}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{format(month, 'MMMM yyyy', { locale: ptBR })}</Text>
        <Pressable onPress={() => setMonth(addMonths(month, 1))} hitSlop={12}>
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, month);
          const isPeriod = periodSet.has(key);
          const isNextPeriod = prediction ? isInRange(key, prediction.nextPeriod) && !isPeriod : false;
          const isOvulation = prediction ? isInRange(key, prediction.ovulation) : false;
          const isFertile = prediction ? isInRange(key, prediction.fertileWindow) && !isOvulation : false;

          let bg = 'transparent';
          if (isPeriod) bg = COLORS.period;
          else if (isNextPeriod) bg = COLORS.nextPeriod;
          else if (isOvulation) bg = COLORS.ovulation;
          else if (isFertile) bg = COLORS.fertile;

          const textColor = isPeriod || isOvulation || isNextPeriod ? '#fff' : inMonth ? COLORS.text : COLORS.muted;

          return (
            <Pressable
              key={key}
              style={[
                styles.cell,
                { backgroundColor: bg },
                key === selectedDay && styles.selected,
              ]}
              accessibilityLabel={`${format(day, "d 'de' MMMM", { locale: ptBR })}${symptomSet.has(key) ? ', com registros' : ''}`}
              onPress={() => onDayPress?.(key)}
            >
              <Text style={[styles.cellText, { color: textColor, opacity: inMonth ? 1 : 0.4 }]}>
                {format(day, 'd')}
              </Text>
              {symptomSet.has(key) && <View style={[styles.symptomDot, { backgroundColor: bg === 'transparent' ? COLORS.text : '#fff' }]} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Legend color={COLORS.period} label="Menstruação" />
        <Legend color={COLORS.nextPeriod} label="Previsão" />
        <Legend color={COLORS.fertile} label="Janela fértil" />
        <Legend color={COLORS.ovulation} label="Ovulação (estimada)" />
      </View>

      {prediction && (
        <Text style={styles.note}>
          Baseado em {prediction.basedOnCycles} ciclo(s). As faixas mostram a variação entre os ciclos; não são um diagnóstico.
        </Text>
      )}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.bg, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' },
  nav: { fontSize: 28, color: COLORS.text, paddingHorizontal: 8 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', color: COLORS.muted, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellText: { fontSize: 14, fontWeight: '500' },
  selected: { borderWidth: 2, borderColor: COLORS.text },
  symptomDot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.text },
  note: { marginTop: 14, fontSize: 12, color: COLORS.muted, lineHeight: 17 },
});
