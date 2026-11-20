import React, { useState } from 'react';
import { ScrollView, Text, Pressable, StyleSheet, View } from 'react-native';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MonthCalendar from '../components/MonthCalendar';
import { useCycle } from '../lib/cycleStore';

export default function CalendarScreen() {
  const { prediction, periodDays, symptomDays, settings, selectedDay, setSelectedDay, cycleStarts, toggleStart } =
    useCycle();
  const [mode, setMode] = useState<'mes' | 'ano'>('mes');
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [year, setYear] = useState(() => new Date().getFullYear());

  const isStart = cycleStarts.includes(selectedDay);
  const shared = { periodDays, prediction, showFertile: settings.showFertile, symptomDays, selectedDay };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.segment}>
        <Pressable style={[styles.segBtn, mode === 'mes' && styles.segBtnActive]} onPress={() => setMode('mes')}>
          <Text style={[styles.segText, mode === 'mes' && styles.segTextActive]}>Mês</Text>
        </Pressable>
        <Pressable style={[styles.segBtn, mode === 'ano' && styles.segBtnActive]} onPress={() => setMode('ano')}>
          <Text style={[styles.segText, mode === 'ano' && styles.segTextActive]}>Ano</Text>
        </Pressable>
      </View>

      {mode === 'mes' ? (
        <MonthCalendar
          {...shared}
          month={viewMonth}
          onMonthChange={setViewMonth}
          onDayPress={(d) => {
            setSelectedDay(d);
            setViewMonth(startOfMonth(parseISO(d)));
          }}
        />
      ) : (
        <View>
          <View style={styles.yearNav}>
            <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={12}>
              <Text style={styles.nav}>‹</Text>
            </Pressable>
            <Text style={styles.yearTitle}>{year}</Text>
            <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={12}>
              <Text style={styles.nav}>›</Text>
            </Pressable>
          </View>
          {Array.from({ length: 12 }, (_, i) => (
            <MonthCalendar
              key={i}
              {...shared}
              month={new Date(year, i, 1)}
              compact
              showLegend={false}
              onDayPress={(d) => {
                setSelectedDay(d);
                setViewMonth(startOfMonth(parseISO(d)));
                setMode('mes');
              }}
            />
          ))}
        </View>
      )}

      <View style={styles.bottom}>
        <Text style={styles.dayTitle}>
          {format(parseISO(selectedDay), "d 'de' MMMM", { locale: ptBR })}
        </Text>
        <Text style={styles.dayHint}>
          {isStart ? 'Início de menstruação registrado neste dia.' : 'Sem início registrado neste dia.'}
        </Text>
        <Pressable style={styles.button} onPress={() => toggleStart(selectedDay)}>
          <Text style={styles.buttonText}>{isStart ? 'Remover início' : 'Editar menstruação'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 32, backgroundColor: '#FFFFFF' },
  segment: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#F4F1F7',
    borderRadius: 999,
    padding: 4,
    marginTop: 12,
  },
  segBtn: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 999 },
  segBtnActive: { backgroundColor: '#FFFFFF' },
  segText: { color: '#6E6478', fontWeight: '500' },
  segTextActive: { color: '#2B2233', fontWeight: '600' },
  yearNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 12 },
  yearTitle: { fontSize: 18, fontWeight: '600', color: '#2B2233' },
  nav: { fontSize: 28, color: '#2B2233', paddingHorizontal: 8 },
  bottom: { marginHorizontal: 16, marginTop: 20, gap: 6 },
  dayTitle: { fontSize: 16, fontWeight: '600', color: '#2B2233', textTransform: 'capitalize' },
  dayHint: { fontSize: 13, color: '#6E6478' },
  button: {
    marginTop: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D9485F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
