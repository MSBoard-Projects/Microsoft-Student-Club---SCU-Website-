import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowUpRight, FiFeather, FiMenu, FiMoon, FiSun, FiX } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import type { ThemeName } from './types';
import { usePublicTheme } from './ThemeProvider';
import { isAdminPath } from './SiteFrame';
import { clubContent } from '../../content/club';
import Icon from './Icon';

const themes: { id: ThemeName; label: string; icon: IconType }[] = [
  { id: 'night', label: 'Night theme', icon: FiMoon },
  { id: 'day', label: 'Day theme', icon: FiSun },
  { id: 'forest', label: 'Forest theme', icon: FiFeather },
];
const links = [{ to: '/', label: 'Home' }, { to: '/events', label: 'Events' }, { to: '/gallery', label: 'Gallery' }, { to: '/members', label: 'Members' }, { to: '/leadership', label: 'Leadership' }, { to: '/leaderboard', label: 'Leaderboard' }, { to: '/sponsors', label: 'Sponsors' }, { to: '/achievements', label: 'Achievements' }];
const activeLink = (pathname: string, target: string) => pathname === target || (['/events', '/members'].includes(target) && pathname.startsWith(`${target}/`));

export default function PublicHeader() {
  const { pathname } = useLocation();
  const { theme, setTheme } = usePublicTheme();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  if (isAdminPath(pathname)) return null;

  return (
    <header className="club-header">
      <a href="#public-main" className="club-skip-link">Skip to content</a>
      <div className="club-container club-header-inner">
        <Link to="/" className="club-brand" aria-label="Microsoft Student Club home" onClick={() => setOpen(false)}>
          {clubContent.assets.logo && <img src={clubContent.assets.logo} alt="" width="112" height="48" />}
          <span><strong>Microsoft Student Club</strong><small>SUEZ CANAL UNIVERSITY</small></span>
        </Link>
        <nav className="club-desktop-navigation" aria-label="Main navigation">
          {links.map(link => <Link key={link.to} to={link.to} aria-current={activeLink(pathname, link.to) ? 'page' : undefined}>{link.label}</Link>)}
        </nav>
        <div className="club-header-actions">
          <div className="club-theme-switch" role="group" aria-label="Color theme">
            {themes.map(option => <button key={option.id} type="button" onClick={() => setTheme(option.id)} aria-pressed={theme === option.id} aria-label={option.label} title={option.label}><Icon glyph={option.icon} /></button>)}
          </div>
          <Link to="/admin/login" className="club-workspace-link">Workspace <Icon glyph={FiArrowUpRight} /></Link>
          <button ref={menuButton} type="button" className="club-menu-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="public-mobile-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} title={open ? 'Close navigation' : 'Open navigation'}><Icon glyph={open ? FiX : FiMenu} /></button>
        </div>
      </div>
      <nav id="public-mobile-navigation" className="club-mobile-navigation club-container" aria-label="Mobile navigation" hidden={!open}>
        {links.map(link => <Link key={link.to} to={link.to} aria-current={activeLink(pathname, link.to) ? 'page' : undefined} onClick={() => setOpen(false)}>{link.label}<Icon glyph={FiArrowUpRight} /></Link>)}
        <Link to="/admin/login" onClick={() => setOpen(false)}>Admin<Icon glyph={FiArrowUpRight} /></Link>
      </nav>
    </header>
  );
}