import { getDb } from './db';

export type Settings = {
  showFertile: boolean;   // mostrar a janela fértil no calendário e na tela Hoje
  cycleLength: number;    // duração padrão do ciclo, usada com poucos registros
  periodLength: number;   // duração padrão da menstruação
  remindersOn: boolean;   // lembretes discretos
};

export const DEFAULT_SETTINGS: Settings = {
  showFertile: true,
  cycleLength: 28,
  periodLength: 5,
  remindersOn: false,
};

export async function loadSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key in DEFAULT_SETTINGS) {
      try {
        (out as Record<string, unknown>)[r.key] = JSON.parse(r.value);
      } catch {
        // valor inválido: mantém o padrão
      }
    }
  }
  return out;
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, JSON.stringify(value));
}
