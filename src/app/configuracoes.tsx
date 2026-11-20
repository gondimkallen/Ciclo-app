import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useCycle } from '../lib/cycleStore';

export default function SettingsScreen() {
  const { settings, updateSetting, setReminders } = useCycle();

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Section title="Calendário (teste)" hint="Seção temporária. Vamos ver se é útil antes de decidir mantê-la.">
        <Row label="Mostrar janela fértil">
          <Switch value={settings.showFertile} onValueChange={(v) => updateSetting('showFertile', v)} />
        </Row>
      </Section>

      <Section title="Ciclo" hint="Usado nas previsões enquanto houver menos de 3 ciclos registrados.">
        <Stepper
          label="Duração do ciclo"
          value={settings.cycleLength}
          unit="dias"
          min={21}
          max={45}
          onChange={(v) => updateSetting('cycleLength', v)}
        />
        <Stepper
          label="Duração da menstruação"
          value={settings.periodLength}
          unit="dias"
          min={2}
          max={10}
          onChange={(v) => updateSetting('periodLength', v)}
        />
      </Section>

      <Section title="Lembretes" hint='As notificações dizem apenas "Lembrete". Nenhum dado de saúde aparece nelas.'>
        <Row label="Lembretes discretos">
          <Switch value={settings.remindersOn} onValueChange={async (v) => { await setReminders(v); }} />
        </Row>
      </Section>
    </ScrollView>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Stepper({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepBtn}
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - 1))}
          accessibilityLabel={`Diminuir ${label}`}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>
          {value} {unit}
        </Text>
        <Pressable
          style={styles.stepBtn}
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + 1))}
          accessibilityLabel={`Aumentar ${label}`}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 20, backgroundColor: '#FFFFFF', paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#2B2233', paddingHorizontal: 4 },
  card: { backgroundColor: '#F7F5F9', borderRadius: 16, overflow: 'hidden' },
  hint: { fontSize: 12, color: '#9A90A3', lineHeight: 17, paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowLabel: { fontSize: 15, color: '#2B2233', flexShrink: 1, marginRight: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 18, color: '#D9485F', fontWeight: '600' },
  stepValue: { fontSize: 14, color: '#2B2233', minWidth: 80, textAlign: 'center' },
});
