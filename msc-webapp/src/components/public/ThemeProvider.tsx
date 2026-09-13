import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ThemeName } from './types';

interface ThemeContextValue { theme: ThemeName; setTheme: (theme: ThemeName) => void }
const ThemeContext = createContext<ThemeContextValue>({ theme: 'night', setTheme: () => {} });
const isTheme = (value: string | null): value is ThemeName => value === 'night' || value === 'day' || value === 'forest';

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    try { const saved = localStorage.getItem('club-theme'); return isTheme(saved) ? saved : 'night'; }
    catch { return 'night'; }
  });
  useEffect(() => {
    try { localStorage.setItem('club-theme', theme); } catch {}
  }, [theme]);
  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === 'club-theme' && isTheme(event.newValue)) setTheme(event.newValue);
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const usePublicTheme = () => useContext(ThemeContext);