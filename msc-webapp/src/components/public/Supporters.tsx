import { useId, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiPause, FiPlay } from 'react-icons/fi';
import Icon from './Icon';
import logos from '../../content/supporterLogos.json';

const programs = [
  { id: 'microsoft', logo: 'microsoft-campus-club-scu', name: 'Microsoft Student Club', relationship: 'SCU branch / Microsoft Campus Club', poweredBy: 'Microsoft' },
  { id: 'github', logo: 'github-campus-expert', name: 'GitHub Campus Expert', relationship: 'Community sponsor', poweredBy: 'GitHub' },
];
const categories = [
  { name: 'Sponsors', roles: { finance: 'Financial sponsor', tmayoz: 'Financial sponsor', redbull: 'Beverage partner', mlh: 'Hackathon sponsor' } },
  { name: 'Strategic Partners', roles: { creativa: 'Strategic partner', 'itida-tiec': 'Government & entrepreneurship partner', kaaf: 'Operational partner' } },
  { name: 'Host & Academic Partner', roles: { 'suez-canal-university': 'Host & academic partner' } },
  { name: 'Empowerment & Reward Partners', roles: { sprints: 'Reward & knowledge partner', 'tech-shift-summit': 'Reward & knowledge partner' } },
  { name: 'Community Partners', roles: { rally: 'Community partner', oleg: 'Community partner', adf: 'Community partner', tros: 'Community partner', ieee: 'Community partner' } },
  { name: 'Technology Partners', roles: { iti: 'Technology partner' } },
] satisfies { name: string; roles: Record<string, string> }[];
const roleFor = (id: string) => categories.flatMap(category => Object.entries(category.roles)).find(([key]) => key === id)?.[1];

export function SupporterPrograms() {
  return <div className="club-program-band" role="group" aria-label="Microsoft and GitHub student program support"><div className="club-container club-program-logos">{programs.map(program => {
    const logo = logos.find(item => item.id === program.logo);
    const parent = logos.find(item => item.id === program.id);
    return logo && parent ? <div className="club-program" key={program.id}><div className="club-program-mark"><img src={logo.src} alt={`${logo.name} logo`} width={logo.width} height={logo.height} loading="lazy" /></div><div className="club-program-copy"><p>{program.relationship}</p><h3>{program.name}</h3><div className="club-program-powered"><span>Powered by {program.poweredBy}</span><img src={parent.src} alt={`${parent.name} logo`} width={parent.width} height={parent.height} loading="lazy" /></div></div></div> : null;
  })}</div></div>;
}

export function SupporterWall({ compact = false }: { compact?: boolean }) {
  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: '100px' });
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  return <section ref={sectionRef} className={`club-section club-supporters${compact ? ' club-supporters-compact' : ''}`} aria-labelledby={titleId} data-paused={paused || !inView || Boolean(reducedMotion)}><div className="club-container club-section-heading"><div><span className="club-eyebrow">OUR COMMUNITY</span><h2 id={titleId}>Sponsors & supporters</h2></div>{compact && <div className="club-moments-actions">{!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play logo animation' : 'Pause logo animation'} title={paused ? 'Play logo animation' : 'Pause logo animation'}><Icon glyph={paused ? FiPlay : FiPause} /></button>}<Link to="/sponsors" className="club-text-link">All partners <Icon glyph={FiArrowUpRight} /></Link></div>}</div>
    {compact ? <div className="club-supporter-rows">{['Logos 1', 'Logos 2'].map((group, rowIndex) => {
      const row = logos.filter(logo => logo.group === group);
      if (!row.length) return null;
      const tiles = Array.from({ length: Math.ceil(16 / row.length) * row.length }, (_, index) => row[index % row.length]);
      return <div className="club-supporter-row" key={group}><h3 className="club-container">{rowIndex === 0 ? 'Sponsors & ecosystem partners' : 'Community partners'}</h3><div className="club-supporter-window" role="region" aria-label={group} tabIndex={0} onBlur={event => { event.currentTarget.scrollLeft = 0; }}><div className={`club-supporter-track${rowIndex === 1 ? ' club-supporter-reverse' : ''}`}>
        {[0, 1].map(copy => <div className={`club-supporter-group${copy ? ' club-supporter-copy' : ''}`} key={copy} aria-hidden={copy ? true : undefined}>{tiles.map((logo, index) => <div className="club-supporter-tile" key={`${logo.id}-${index}`} aria-hidden={index >= row.length ? true : undefined} title={`${logo.name} - ${roleFor(logo.id) ?? 'Partner'}`}><img src={logo.src} alt={`${logo.name} logo`} width={logo.width} height={logo.height} loading="lazy" /><span className="sr-only">{roleFor(logo.id)}</span></div>)}</div>)}
      </div></div></div>;
    })}</div> : <><SupporterPrograms /><div className="club-container">{categories.map(category => {
      const entries = logos.filter(logo => Object.keys(category.roles).includes(logo.id));
      return entries.length ? <section className="club-supporter-category" key={category.name} aria-label={category.name}><h3>{category.name}</h3><div className="club-supporter-grid">{entries.map(logo => <figure key={logo.id}><div className="club-supporter-logo"><img src={logo.src} alt={`${logo.name} logo`} width={logo.width} height={logo.height} loading="lazy" /></div><figcaption><strong>{logo.name}</strong><span>{roleFor(logo.id)}</span></figcaption></figure>)}</div></section> : null;
    })}</div></>}
  </section>;
}