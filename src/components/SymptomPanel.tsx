import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { SymptomEntry, SymptomKind, setSymptom } from '../lib/symptoms';

type Props = {
  day: string;
  entries: SymptomEntry[];
  onChange: () => void;
};

const CRAMPS = ['Leve', 'Moderada', 'Forte'];
const MOOD = ['Estável', 'Animada', 'Irritada', 'Ansiosa', 'Triste'];
const DISCHARGE = ['Seco', 'Cremoso', 'Aquoso', 'Com sangue'];
const LIBIDO = ['Baixa', 'Normal', 'Alta'];

export default function SymptomPanel({ day, entries, onChange }: Props) {
  const [customText, setCustomText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const valueOf = (kind: SymptomKind) => entries.find((e) => e.kind === kind && e.customLabel === '')?.value ?? null;
  const customs = entries.filter((e) => e.kind === 'custom');

  const pick = async (kind: SymptomKind, option: string) => {
    const current = valueOf(kind);
    await setSymptom(day, kind, current === option ? null : option);
    onChange();
  };

  const toggleSex = async () => {
    const current = valueOf('sex');
    await setSymptom(day, 'sex', current ? null : 'Sim');
    onChange();
  };

  const addCustom = async () => {
    const label = customText.trim();
    if (!label) {
      setError('Digite o nome do sintoma.');
      return;
    }
    if (label.length > 40) {
      setError('Use até 40 caracteres.');
      return;
    }
    setError(null);
    await setSymptom(day, 'custom', 'Sim', label);
    setCustomText('');
    onChange();
  };

  const removeCustom = async (label: string) => {
    await setSymptom(day, 'custom', null, label);
    onChange();
  };

  return (
    <View style={styles.wrap}>
      <Group title="Cólica">
        <Choices options={CRAMPS} selected={valueOf('cramps')} onPick={(o) => pick('cramps', o)} />
      </Group>
      <Group title="Humor">
        <Choices options={MOOD} selected={valueOf('mood')} onPick={(o) => pick('mood', o)} />
      </Group>
      <Group title="Corrimento">
        <Choices options={DISCHARGE} selected={valueOf('discharge')} onPick={(o) => pick('discharge', o)} />
      </Group>
      <Group title="Sexo">
        <Choices options={['Teve relação']} selected={valueOf('sex') ? 'Teve relação' : null} onPick={toggleSex} />
      </Group>
      <Group title="Libido">
        <Choices options={LIBIDO} selected={valueOf('libido')} onPick={(o) => pick('libido', o)} />
      </Group>

      <Group title="Sintomas personalizados">
        {customs.map((c) => (
          <View key={c.customLabel} style={styles.customRow}>
            <Text style={styles.customLabel}>{c.customLabel}</Text>
            <Pressable onPress={() => removeCustom(c.customLabel)} hitSlop={10}>
              <Text style={styles.remove}>Remover</Text>
            </Pressable>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Ex.: dor de cabeça"
            placeholderTextColor="#9A90A3"
            value={customText}
            onChangeText={(t) => {
              setCustomText(t);
              if (error) setError(null);
            }}
            maxLength={40}
          />
          <Pressable style={styles.addButton} onPress={addCustom}>
            <Text style={styles.addButtonText}>Adicionar</Text>
          </Pressable>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </Group>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Choices({
  options,
  selected,
  onPick,
}: {
  options: string[];
  selected: string | null;
  onPick: (option: string) => void;
}) {
  return (
    <View style={styles.choices}>
      {options.map((o) => {
        const active = selected === o;
        return (
          <Pressable
            key={o}
            onPress={() => onPick(o)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  group: { marginBottom: 16 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: '#2B2233', marginBottom: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#D8D2DF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: '#D9485F', borderColor: '#D9485F' },
  chipText: { color: '#2B2233', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  customRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  customLabel: { color: '#2B2233', fontSize: 14 },
  remove: { color: '#9A90A3', fontSize: 13 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8D2DF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#2B2233',
  },
  addButton: { backgroundColor: '#2B2233', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#D9485F', fontSize: 13, marginTop: 6 },
});
