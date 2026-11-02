// Prisma result extensions expose inspection symbols through their proxies.
// Copy string-keyed values before crossing the React server/client boundary,
// preserving Dates (unlike a JSON stringify/parse round trip).
export function plainData<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map(item => plainData(item)) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plainData(item)])) as T;
  }
  return value;
}
