import { useEffect, useState, useCallback } from 'react';
import { storage } from '../utils/storage';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const fromStorage = storage.get<string>(STORAGE_KEY);
  if (fromStorage === 'light' || fromStorage === 'dark') return fromStorage;
  // Unprefixed `theme` key may exist on a user's machine; rewrite under the
  // `storage` prefix so a future `storage.clear()` covers it uniformly.
  try {
    const raw = window.localStorage.getItem('theme');
    if (raw === 'light' || raw === 'dark') {
      storage.set(STORAGE_KEY, raw);
      window.localStorage.removeItem('theme');
      return raw;
    }
  } catch (err) {
    console.warn('useTheme: raw-key migration failed', err);
  }
  return 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('theme-dark', theme === 'dark');
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    storage.set(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggle };
}
