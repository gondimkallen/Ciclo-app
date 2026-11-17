import * as Notifications from 'expo-notifications';
import { parseISO, subDays, setHours, setMinutes, isAfter } from 'date-fns';

// Notificações discretas: o texto não revela nada sobre saúde, ciclo ou sintomas.
const DISCREET_TITLE = 'Lembrete';
const DISCREET_BODY = 'Abra o app para ver os detalhes.';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Agenda um lembrete discreto às 9h do dia anterior a cada data-chave
 * (início previsto da janela fértil e da próxima menstruação).
 * Cancela os lembretes anteriores antes de agendar os novos.
 */
export async function scheduleDiscreetReminders(dates: string[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  for (const d of dates) {
    const base = subDays(parseISO(d), 1);
    const when = setMinutes(setHours(base, 9), 0);
    if (!isAfter(when, now)) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: DISCREET_TITLE, body: DISCREET_BODY, sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
  }
}

export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
