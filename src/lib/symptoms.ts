import { getDb } from './db';

export type SymptomKind = 'cramps' | 'mood' | 'discharge' | 'sex' | 'libido' | 'custom';

export type SymptomEntry = {
  kind: SymptomKind;
  value: string | null;
  customLabel: string;
};

export async function listSymptoms(day: string): Promise<SymptomEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ kind: SymptomKind; value: string | null; custom_label: string }>(
    'SELECT kind, value, custom_label FROM symptom_entries WHERE day = ?',
    day
  );
  return rows.map((r) => ({ kind: r.kind, value: r.value, customLabel: r.custom_label }));
}

/** Grava (ou remove, se value for null) um sintoma do dia. */
export async function setSymptom(
  day: string,
  kind: SymptomKind,
  value: string | null,
  customLabel = ''
): Promise<void> {
  const db = await getDb();
  if (value === null) {
    await db.runAsync(
      'DELETE FROM symptom_entries WHERE day = ? AND kind = ? AND custom_label = ?',
      day,
      kind,
      customLabel
    );
    return;
  }
  await db.runAsync(
    'INSERT OR REPLACE INTO symptom_entries (day, kind, value, custom_label) VALUES (?, ?, ?, ?)',
    day,
    kind,
    value,
    customLabel
  );
}

/** Dias que têm qualquer registro, para marcar no calendário. */
export async function daysWithSymptoms(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>('SELECT DISTINCT day FROM symptom_entries');
  return rows.map((r) => r.day);
}
