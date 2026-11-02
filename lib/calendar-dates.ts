// Calendar picks are local wall dates. Persist them as date-only strings so the
// visitor's timezone never moves a reservation to the previous/next day.
export function calendarDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calendarDate(value: Date | string): Date {
  const key = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function propertyDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mazatlan', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function propertyCalendarDate(value: Date | string): Date {
  return calendarDate(propertyDateKey(new Date(value)));
}
