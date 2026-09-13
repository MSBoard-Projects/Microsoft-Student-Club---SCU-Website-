import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiAward, FiCalendar, FiExternalLink, FiFileText, FiGrid, FiLock, FiLogOut, FiMenu, FiShield, FiUploadCloud, FiUsers, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const navigation = [
  { path: '/admin/dashboard', label: 'Overview', icon: FiGrid },
  { path: '/admin/members', label: 'Members', icon: FiUsers },
  { path: '/admin/events', label: 'Events', icon: FiCalendar },
  { path: '/admin/achievements', label: 'Achievements', icon: FiAward },
  { path: '/admin/statistics', label: 'Statistics', icon: FiGrid },
  { path: '/admin/content', label: 'Site content', icon: FiFileText },
];

export default function AdminLayout() {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const reducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuButton = useRef(null);
  const content = useRef(null);
  const links = isSuperAdmin() ? [...navigation, { path: '/admin/users', label: 'Admin users', icon: FiShield }] : navigation;
  const currentTitle = links.find(link => link.path === location.pathname)?.label || 'Workspace';

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    content.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  const toggleMenu = () => {
    if (!menuOpen) window.scrollTo({ top: 0, behavior: 'instant' });
    setMenuOpen(value => !value);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const result = await logout();
      if (result?.success === false) toast.warning(result.error);
    } catch {
      toast.error('Server logout could not be confirmed.');
    } finally {
      setLoggingOut(false);
      navigate('/admin/login', { replace: true });
    }
  };

  return <div className="admin-shell min-h-screen" onKeyDown={event => {
    if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
  }}>
    <a className="admin-skip-link" href="#admin-content">Skip to workspace</a>
    <header className="admin-topbar">
      <div className="admin-topbar-brand"><button type="button" ref={menuButton} className="admin-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={toggleMenu}>{menuOpen ? <FiX /> : <FiMenu />}</button>
        <Link to="/admin/dashboard" className="admin-brand"><span className="admin-brand-mark" aria-hidden="true">MSC</span><span>Club workspace<span className="admin-brand-subtitle">SUEZ CANAL UNIVERSITY</span></span></Link>
      </div>
      <Link className="admin-public-link" to="/" title="Open public website"><span>Public website</span><FiExternalLink aria-hidden="true" /></Link>
    </header>
    <div className="admin-shell-body">
      <aside id="admin-sidebar" className={`admin-sidebar ${menuOpen ? 'admin-sidebar-open' : ''}`}>
        <p className="admin-nav-label">WORKSPACE</p>
        <nav aria-label="Admin navigation">{links.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-active' : ''}`}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
        <div className="admin-deferred-nav"><p className="admin-nav-label">PENDING SETUP</p>
          {[{ label: 'Excel import', icon: FiUploadCloud }, { label: 'QR attendance', icon: FiGrid }, { label: 'Certificates', icon: FiAward }].map(({ label, icon: Icon }) => <div key={label} className="admin-nav-pending" aria-disabled="true" title="Backend setup deferred"><Icon aria-hidden="true" /><span>{label}</span><FiLock aria-hidden="true" /></div>)}
        </div>
        <div className="admin-session"><div className="admin-session-heading"><FiShield aria-hidden="true" /><span>{user?.role === 'SuperAdmin' ? 'Super Admin' : 'Content Editor'}</span></div><p title={user?.email}>{user?.email}</p>
          <button type="button" className="admin-logout" onClick={handleLogout} disabled={loggingOut}><FiLogOut aria-hidden="true" />{loggingOut ? 'Signing out...' : 'Sign out'}</button>
        </div>
      </aside>
      <div id="admin-content" ref={content} tabIndex={-1} className="admin-workspace" aria-label={currentTitle}>
        <div className="admin-breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>{currentTitle}</strong><span className="admin-session-label"><FiLock aria-hidden="true" />Admin access</span></div>
        <AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}>{outlet}</motion.div></AnimatePresence>
      </div>
    </div>
  </div>;
}