import * as SQLite from 'expo-sqlite';

// Todos os dados ficam apenas no aparelho, em SQLite local. Nada é enviado para servidores.
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('ciclo.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS cycles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          start_date TEXT NOT NULL UNIQUE,   -- yyyy-MM-dd
          end_date TEXT                       -- yyyy-MM-dd, opcional
        );
        CREATE TABLE IF NOT EXISTS symptom_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          day TEXT NOT NULL,                  -- yyyy-MM-dd
          kind TEXT NOT NULL,                 -- cramps | mood | discharge | sex | libido | custom
          value TEXT,                         -- intensidade ou descrição
          custom_label TEXT NOT NULL DEFAULT '', -- usado quando kind = custom ('' nos demais, para o UNIQUE funcionar)
          UNIQUE(day, kind, custom_label)
        );
        CREATE INDEX IF NOT EXISTS idx_symptom_day ON symptom_entries(day);
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function listCycleStarts(): Promise<{ startDate: string; endDate: string | null }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ start_date: string; end_date: string | null }>(
    'SELECT start_date, end_date FROM cycles ORDER BY start_date ASC'
  );
  return rows.map((r) => ({ startDate: r.start_date, endDate: r.end_date }));
}

export async function addCycleStart(startDate: string, endDate: string | null = null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO cycles (start_date, end_date) VALUES (?, ?)',
    startDate,
    endDate
  );
}

export async function deleteCycleStart(startDate: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cycles WHERE start_date = ?', startDate);
}
