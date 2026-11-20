import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  addMonths,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  format,
  isSameMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Prediction, isInRange } from '../lib/prediction';

type Props = {
  month: Date;
  onMonthChange?: (month: Date) => void; // se informado, mostra as setas de navegação
  periodDays: string[];
  prediction: Prediction | null;
  showFertile: boolean;
  selectedDay?: string;
  symptomDays?: string[];
  onDayPress?: (day: string) => void;
  compact?: boolean;
  showLegend?: boolean;
};

const COLORS = {
  period: '#D9485F',
  nextPeriod: '#F4A3B0',
  ovulation: '#7B61C9',
  fertile: '#CDBFEF',
  text: '#2B2233',
  muted: '#9A90A3',
};

export default function MonthCalendar({
  month,
  onMonthChange,
  periodDays,
  prediction,
  showFertile,
  selectedDay,
  symptomDays = [],
  onDayPress,
  compact = false,
  showLegend = true,
}: Props) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const periodSet = useMemo(() => new Set(periodDays), [periodDays]);
  const symptomSet = useMemo(() => new Set(symptomDays), [symptomDays]);
  const cellText = compact ? 11 : 14;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.header}>
        {onMonthChange ? (
          <Pressable onPress={() => onMonthChange(addMonths(month, -1))} hitSlop={12}>
            <Text style={styles.nav}>‹</Text>
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </Text>
        {onMonthChange ? (
          <Pressable onPress={() => onMonthChange(addMonths(month, 1))} hitSlop={12}>
            <Text style={styles.nav}>›</Text>
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      <View style={styles.weekRow}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <Text key={i} style={[styles.weekLabel, compact && { fontSize: 9 }]}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, month);
          const isPeriod = periodSet.has(key);
          const isNextPeriod = prediction ? isInRange(key, prediction.nextPeriod) && !isPeriod : false;
          const isOvulation = prediction ? isInRange(key, prediction.ovulation) : false;
          const isFertile = showFertile && prediction ? isInRange(key, prediction.fertileWindow) && !isOvulation : false;

          let bg = 'transparent';
          if (isPeriod) bg = COLORS.period;
          else if (isNextPeriod) bg = COLORS.nextPeriod;
          else if (isOvulation) bg = COLORS.ovulation;
          else if (isFertile) bg = COLORS.fertile;

          const filled = bg !== 'transparent';
          const textColor = filled && bg !== COLORS.fertile ? '#fff' : inMonth ? COLORS.text : COLORS.muted;

          return (
            <Pressable
              key={key}
              style={[styles.cell, { backgroundColor: bg }, key === selectedDay && styles.selected]}
              accessibilityLabel={`${format(day, "d 'de' MMMM", { locale: ptBR })}${symptomSet.has(key) ? ', com registros' : ''}`}
              onPress={() => onDayPress?.(key)}
            >
              <Text style={[styles.cellText, { fontSize: cellText, color: textColor, opacity: inMonth ? 1 : 0.4 }]}>
                {format(day, 'd')}
              </Text>
              {symptomSet.has(key) && (
                <View style={[styles.symptomDot, { backgroundColor: filled && bg !== COLORS.fertile ? '#fff' : COLORS.text }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {showLegend && (
        <View style={styles.legend}>
          <Legend color={COLORS.period} label="Menstruação" />
          <Legend color={COLORS.nextPeriod} label="Previsão" />
          {showFertile && <Legend color={COLORS.fertile} label="Janela fértil" />}
          <Legend color={COLORS.ovulation} label="Ovulação (estimada)" />
        </View>
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
  container: { padding: 16 },
  containerCompact: { paddingVertical: 10, paddingHorizontal: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' },
  titleCompact: { fontSize: 14, marginBottom: 4 },
  nav: { fontSize: 28, color: COLORS.text, paddingHorizontal: 8 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', color: COLORS.muted, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellText: { fontWeight: '500' },
  selected: { borderWidth: 2, borderColor: COLORS.text },
  symptomDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.text },
});
