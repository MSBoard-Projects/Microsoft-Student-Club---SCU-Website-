import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { usePublicTheme } from './ThemeProvider';
import './public.css';
import '../../designs/glass.css';

export const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

export default function SiteFrame({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const { theme } = usePublicTheme();
  const admin = isAdminPath(pathname);
  const [savedDesign, setSavedDesign] = useState(() => {
    try { return localStorage.getItem('club-design') === 'classic' ? 'classic' : 'glass'; }
    catch { return 'glass'; }
  });
  const requested = new URLSearchParams(search).get('design');
  const adminDesign = requested === 'classic' || requested === 'glass' ? requested : savedDesign;
  const design = admin ? adminDesign : theme === 'forest' ? 'glass' : 'classic';
  useEffect(() => {
    if (!admin) return;
    setSavedDesign(adminDesign);
    try { localStorage.setItem('club-design', adminDesign); } catch {}
  }, [admin, adminDesign]);
  return <div className={admin ? 'App flex flex-col min-h-screen' : 'App club-public'} data-design={design} data-theme={admin ? (design === 'glass' ? 'day' : undefined) : theme === 'forest' ? 'night' : theme}>{children}</div>;
}