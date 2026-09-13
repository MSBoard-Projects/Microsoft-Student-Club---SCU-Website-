import { Link, useLocation } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import Icon from './Icon';
import { isAdminPath } from './SiteFrame';

export default function PublicFooter() {
  const { pathname } = useLocation();
  if (isAdminPath(pathname)) return null;
  return (
    <footer className="club-footer">
      <div className="club-container">
        <div className="club-footer-top">
          <div><span className="club-eyebrow">MICROSOFT STUDENT CLUB / SCU</span><h2>Stay curious.<br /><span>Build what's next.</span></h2></div>
          <nav aria-label="Footer navigation"><Link to="/">Home</Link><Link to="/events">Events</Link><Link to="/members">Members</Link><Link to="/leadership">Leadership</Link><Link to="/achievements">Achievements</Link></nav>
          <div className="club-footer-resources"><span>KEEP EXPLORING</span><a href="https://learn.microsoft.com/" target="_blank" rel="noreferrer">Microsoft Learn <Icon glyph={FiArrowUpRight} /></a><a href="https://github.com/explore" target="_blank" rel="noreferrer">Explore GitHub <Icon glyph={FiArrowUpRight} /></a></div>
        </div>
        <div className="club-footer-bottom"><span>&copy; {new Date().getFullYear()} Microsoft Student Club, SCU.</span><span>Student-led. Community-powered.</span><Link to="/admin/login">Admin access <Icon glyph={FiArrowUpRight} /></Link></div>
      </div>
    </footer>
  );
}