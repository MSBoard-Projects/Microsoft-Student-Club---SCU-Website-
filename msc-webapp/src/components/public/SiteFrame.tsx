import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { usePublicTheme } from './ThemeProvider';
import './public.css';

export const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

export default function SiteFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { theme } = usePublicTheme();
  const admin = isAdminPath(pathname);
  return <div className={admin ? 'App flex flex-col min-h-screen' : 'App club-public'} data-theme={admin ? undefined : theme}>{children}</div>;
}