const PREFIX = 'erasure_';

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      // Safari private mode + corrupt JSON both throw here. Surface as a
      // dev breadcrumb rather than swallowing — the missing entry is
      // already visible to the caller (null return), but a future user
      // report of "my saved data didn't persist" needs a console clue.
      console.warn(`storage.get(${key}) failed:`, err);
      return null;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) {
      // Quota-exceeded (5-10MB ceiling), Safari private mode, or some
      // privacy extensions all throw. Surface so the breadcrumb exists;
      // callers can opt into a user-facing alert via the boolean return.
      console.warn(`storage.set(${key}) failed:`, err);
      return false;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (err) {
      console.warn(`storage.remove(${key}) failed:`, err);
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.warn('storage.clear failed:', err);
    }
  },
};
