import { addDays, differenceInCalendarDays, parseISO, format } from 'date-fns';

export type CycleRecord = {
  startDate: string; // yyyy-MM-dd, primeiro dia da menstruação
};

export type DayRange = { from: string; to: string };

export type Prediction = {
  nextPeriod: DayRange;
  ovulation: DayRange;
  fertileWindow: DayRange;
  avgCycleLength: number;
  avgPeriodLength: number;
  basedOnCycles: number;
};

const LUTEAL_PHASE_DAYS = 14;
const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;
const MAX_CYCLES_USED = 6;
const MIN_CYCLES_USED = 3;

/**
 * Calcula a previsão a partir dos últimos 3 a 6 ciclos.
 * As datas são mostradas como faixas (mínimo a máximo), não como um único dia,
 * porque a variação entre ciclos é normal.
 */
export function predictCycle(cycles: CycleRecord[], periodLengths: number[] = []): Prediction | null {
  if (cycles.length === 0) return null;

  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = differenceInCalendarDays(parseISO(sorted[i].startDate), parseISO(sorted[i - 1].startDate));
    if (days >= 15 && days <= 60) lengths.push(days);
  }

  const used = lengths.slice(-MAX_CYCLES_USED);
  const enough = used.length >= MIN_CYCLES_USED;
  const avgCycle = enough ? mean(used) : DEFAULT_CYCLE;
  const minCycle = enough ? Math.min(...used) : avgCycle - 2;
  const maxCycle = enough ? Math.max(...used) : avgCycle + 2;

  const usedPeriods = periodLengths.slice(-MAX_CYCLES_USED).filter((d) => d >= 1 && d <= 12);
  const avgPeriod = usedPeriods.length >= MIN_CYCLES_USED ? mean(usedPeriods) : DEFAULT_PERIOD;

  const last = parseISO(sorted[sorted.length - 1].startDate);
  const nextStart = addDays(last, Math.round(avgCycle));
  const nextStartMin = addDays(last, Math.round(minCycle));
  const nextStartMax = addDays(last, Math.round(maxCycle));

  // Ovulação estimada: cerca de 14 dias antes da próxima menstruação (fase lútea relativamente constante)
  const ovMin = addDays(nextStartMin, -LUTEAL_PHASE_DAYS);
  const ovMax = addDays(nextStartMax, -LUTEAL_PHASE_DAYS);

  // Janela fértil: 5 dias antes da ovulação até 1 dia depois
  const fertileFrom = addDays(ovMin, -5);
  const fertileTo = addDays(ovMax, 1);

  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  return {
    nextPeriod: { from: fmt(nextStartMin), to: fmt(nextStartMax) },
    ovulation: { from: fmt(ovMin), to: fmt(ovMax) },
    fertileWindow: { from: fmt(fertileFrom), to: fmt(fertileTo) },
    avgCycleLength: Math.round(avgCycle),
    avgPeriodLength: Math.round(avgPeriod),
    basedOnCycles: used.length,
  };
}

export function isInRange(dateStr: string, range: DayRange): boolean {
  return dateStr >= range.from && dateStr <= range.to;
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}
