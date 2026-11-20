import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCycle } from '../lib/cycleStore';

const fmt = (s: string) => format(parseISO(s), "d 'de' MMMM", { locale: ptBR });

export default function TodayScreen() {
  const { prediction, periodDays, cycleStarts, settings, toggleStart, setSelectedDay } = useCycle();
  const today = format(new Date(), 'yyyy-MM-dd');
  const isStartToday = cycleStarts.includes(today);
  const inPeriod = periodDays.includes(today);

  let title = 'Sem previsão ainda';
  let text = 'Registre o início da sua menstruação para ver a previsão.';
  if (inPeriod) {
    title = 'Menstruação em andamento';
    text = 'Hoje é um dia de menstruação.';
  } else if (prediction) {
    title = 'A menstruação pode começar';
    text = `Entre ${fmt(prediction.nextPeriod.from)} e ${fmt(prediction.nextPeriod.to)}.`;
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{text}</Text>
        {prediction && (
          <Text style={styles.cardMuted}>
            Ovulação estimada entre {fmt(prediction.ovulation.from)} e {fmt(prediction.ovulation.to)}.
          </Text>
        )}
        {prediction && settings.showFertile && (
          <Text style={styles.cardMuted}>
            Janela fértil entre {fmt(prediction.fertileWindow.from)} e {fmt(prediction.fertileWindow.to)}.
          </Text>
        )}
      </View>

      <Pressable
        style={[styles.primary, isStartToday && styles.primaryOutline]}
        onPress={() => toggleStart(today)}
      >
        <Text style={[styles.primaryText, isStartToday && styles.primaryTextOutline]}>
          {isStartToday ? 'Remover início de hoje' : 'Registrar menstruação'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondary}
        onPress={() => {
          setSelectedDay(today);
          router.navigate('/sintomas');
        }}
      >
        <Text style={styles.secondaryText}>Sintomas de hoje</Text>
      </Pressable>

      <Text style={styles.hint}>
        A previsão usa os seus últimos ciclos. As datas são faixas, porque a variação entre ciclos é normal. Não é método contraceptivo nem diagnóstico.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, backgroundColor: '#FFFFFF' },
  card: { backgroundColor: '#FFF1F4', borderRadius: 20, padding: 20, gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#2B2233' },
  cardText: { fontSize: 15, color: '#2B2233', lineHeight: 21 },
  cardMuted: { fontSize: 13, color: '#6E6478', lineHeight: 18, marginTop: 4 },
  primary: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#D9485F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOutline: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D9485F' },
  primaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  primaryTextOutline: { color: '#D9485F' },
  secondary: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F4F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#2B2233', fontWeight: '600', fontSize: 15 },
  hint: { fontSize: 12, color: '#9A90A3', lineHeight: 17, marginTop: 8 },
});
