import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowUpRight, FiCpu, FiLayout, FiServer, FiPenTool, FiSmartphone, FiShield, FiUsers, FiHeart, FiClipboard, FiCamera, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';
import Icon from '../components/public/Icon';

const groups = [
  { id: 'technical', title: 'Technical', tracks: [
    { title: 'Artificial Intelligence', icon: FiCpu, text: 'Explore machine learning, data preparation and intelligent applications through practical experiments.' },
    { title: 'Front-End', icon: FiLayout, text: 'Build responsive, accessible web experiences with HTML, CSS, JavaScript and modern UI frameworks.' },
    { title: 'Back-End', icon: FiServer, text: 'Design APIs, work with databases and build secure, reliable server-side applications.' },
    { title: 'UI/UX', icon: FiPenTool, text: 'Understand user needs, map journeys and turn ideas into clear interfaces and interactive prototypes.' },
    { title: 'Mobile', icon: FiSmartphone, text: 'Create mobile experiences, connect apps to APIs and explore testing and application delivery.' },
    { title: 'Cyber Security', icon: FiShield, text: 'Learn security fundamentals, defensive practices and ethical testing in authorized learning environments.' },
  ] },
  { id: 'operations', title: 'Operations', tracks: [
    { title: 'PR & Fundraising', icon: FiUsers, text: 'Build partnerships, communicate the club mission and develop proposals that support community activities.' },
    { title: 'Human Resources', icon: FiHeart, text: 'Support recruitment, onboarding, team development and a welcoming, collaborative member experience.' },
    { title: 'Project Management', icon: FiClipboard, text: 'Turn ideas into deliverable plans, coordinate teams and manage schedules, resources and project risks.' },
    { title: 'Media', icon: FiCamera, text: 'Tell the community story through graphic design, video editing and marketing.' },
  ] },
  { id: 'soft-skills', title: 'Soft Skills', tracks: [
    { title: 'Soft Skills', icon: FiMessageCircle, text: 'Practice communication, presentation, teamwork, leadership and problem-solving for study and professional life.' },
  ] },
  { id: 'entrepreneurship', title: 'Entrepreneurship & Startup', tracks: [
    { title: 'Entrepreneurship & Startup', icon: FiTrendingUp, text: 'Discover real problems, validate ideas, explore business models and develop a compelling startup pitch.' },
  ] },
];

export function TracksSection({ preview = false }: { preview?: boolean }) {
  const reducedMotion = useReducedMotion();
  return <section className="club-section club-tracks" aria-label="Club tracks">
    <div className="club-container">
      {preview && <div className="club-section-heading"><div><span className="club-eyebrow">LEARN. BUILD. LEAD.</span><h2>Find your track</h2><p>Technology, people and ideas. Different paths, one community.</p></div><Link to="/tracks" className="club-text-link">Explore tracks <Icon glyph={FiArrowUpRight} /></Link></div>}
      {groups.map(group => <div className="club-track-group" id={preview ? undefined : group.id} key={group.id}>
        <h2 className="club-track-group-title">{preview ? <Link to={`/tracks#${group.id}`}>{group.title} <Icon glyph={FiArrowUpRight} /></Link> : group.title}</h2>
        <div className="club-track-grid">{group.tracks.map((track, index) => <motion.article className="club-track" key={track.title}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.4, delay: index * 0.05 }}>
          <Icon glyph={track.icon} className="club-track-icon" /><h3>{track.title}</h3><p>{track.text}</p>
        </motion.article>)}</div>
      </div>)}
    </div>
  </section>;
}

export default function Tracks() {
  const { hash } = useLocation();
  useEffect(() => {
    const group = groups.find(item => `#${item.id}` === hash);
    if (group) document.getElementById(group.id)?.scrollIntoView({ block: 'start' });
  }, [hash]);
  return <><header className="club-container club-page-heading"><span className="club-eyebrow">MICROSOFT STUDENT CLUB / SCU</span><h1>Our Tracks</h1><p>Develop technical skills, grow as a leader and turn shared ideas into meaningful projects.</p><nav className="club-track-navigation" aria-label="Track groups">{groups.map(group => <a key={group.id} href={`#${group.id}`}>{group.title}</a>)}</nav></header><TracksSection /></>;
}