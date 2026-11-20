import React, { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable, StyleSheet, View } from 'react-native';
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SymptomPanel from '../components/SymptomPanel';
import { useCycle } from '../lib/cycleStore';
import { SymptomEntry, listSymptoms } from '../lib/symptoms';

export default function SymptomsScreen() {
  const { selectedDay, setSelectedDay, symptomDays, refresh } = useCycle();
  const [entries, setEntries] = useState<SymptomEntry[]>([]);

  useEffect(() => {
    listSymptoms(selectedDay).then(setEntries);
  }, [selectedDay, symptomDays]);

  const shift = (n: number) => setSelectedDay(format(addDays(parseISO(selectedDay), n), 'yyyy-MM-dd'));
  const isToday = isSameDay(parseISO(selectedDay), new Date());

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.dayNav}>
        <Pressable onPress={() => shift(-1)} hitSlop={12}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.dayTitle}>{format(parseISO(selectedDay), "d 'de' MMMM", { locale: ptBR })}</Text>
          {isToday && <Text style={styles.dayHint}>Hoje</Text>}
        </View>
        <Pressable onPress={() => shift(1)} hitSlop={12}>
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>

      <SymptomPanel day={selectedDay} entries={entries} onChange={() => refresh()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 32, backgroundColor: '#FFFFFF' },
  dayNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  dayTitle: { fontSize: 16, fontWeight: '600', color: '#2B2233', textTransform: 'capitalize' },
  dayHint: { fontSize: 12, color: '#9A90A3', marginTop: 2 },
  nav: { fontSize: 28, color: '#2B2233', paddingHorizontal: 8 },
});
