import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { sponsorsApi } from '../services/api';
import { useShowcase } from '../context/ShowcaseContext';
import usePublishedCollection from '../hooks/usePublishedCollection';
import { parseSponsors, sponsorTiers, type SponsorRecord, type SponsorTier } from '../content/sponsors';
import OptimizedImage from '../components/public/OptimizedImage';
import Icon from '../components/public/Icon';
import { SupporterWall } from '../components/public/Supporters';

const loadSponsors = () => sponsorsApi.getPublished();

function SponsorGroups({ sponsors }: { sponsors: SponsorRecord[] }) {
  return <>{(Object.keys(sponsorTiers) as SponsorTier[]).map(tier => {
    const records = sponsors.filter(sponsor => sponsor.tier === tier);
    return records.length ? <section key={tier} className={`club-sponsor-tier club-sponsor-${tier}`} aria-label={sponsorTiers[tier]}><h2>{sponsorTiers[tier]} <span>{records.length}</span></h2><div className="club-sponsor-grid">{records.map(sponsor => <article className="club-sponsor-card" key={sponsor.id}>
      <div className="club-sponsor-logo"><OptimizedImage src={sponsor.logoUrl} alt={`${sponsor.name} logo`} fit="contain" aspectRatio="2 / 1" framed={false} sizes="240px" /></div>
      <h3>{sponsor.name}</h3>{sponsor.description && <p>{sponsor.description}</p>}
      {sponsor.eventKey && <Link to={`/events/${encodeURIComponent(sponsor.eventKey)}`}>{sponsor.eventTitle || 'Event'}</Link>}
      {sponsor.websiteUrl && <a className="club-text-link" href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer">{sponsor.name} website <Icon glyph={FiArrowUpRight} /></a>}
    </article>)}</div></section> : null;
  })}</>;
}

export function EventSponsors({ eventId }: { eventId: string }) {
  const { data, loading, error, retry } = usePublishedCollection(loadSponsors, parseSponsors);
  const sponsors = data.filter(sponsor => sponsor.eventKey === eventId);
  return <section className="club-event-sponsors" aria-label="Event sponsors and partners"><div className="club-section-heading"><h2>Sponsors & partners</h2><Link to="/sponsors" className="club-text-link">All sponsors <Icon glyph={FiArrowUpRight} /></Link></div>
    {loading ? <p role="status">Loading sponsors...</p> : error ? <p role="alert">{error}<button type="button" onClick={retry}>Try again</button></p> : sponsors.length ? <SponsorGroups sponsors={sponsors} /> : <p>No sponsors published for this event yet.</p>}
  </section>;
}

export default function Sponsors() {
  const { data: { events }, source } = useShowcase();
  const { data, loading, error, retry } = usePublishedCollection(loadSponsors, parseSponsors);
  const [tier, setTier] = useState('all');
  const [event, setEvent] = useState('all');
  const filtered = data.filter(sponsor => (tier === 'all' || sponsor.tier === tier) && (event === 'all' || (event === 'club' && sponsor.eventKey === null) || sponsor.eventKey === event));
  if (source === 'local') return <div><header className="club-page-heading club-container"><span className="club-eyebrow">MICROSOFT STUDENT CLUB / SCU</span><h1>Sponsors & Partners</h1></header><SupporterWall /></div>;
  return <div className="club-container club-directory"><header className="club-page-heading"><span className="club-eyebrow">MICROSOFT STUDENT CLUB / SCU</span><h1>Sponsors & Partners</h1><p>The organisations supporting our community.</p></header>
    <div className="club-event-toolbar"><label className="club-event-filter"><span className="sr-only">Sponsor tier</span><select aria-label="Sponsor tier" value={tier} onChange={change => setTier(change.target.value)}><option value="all">All tiers</option>{Object.entries(sponsorTiers).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <label className="club-event-filter"><span className="sr-only">Sponsor event</span><select aria-label="Sponsor event" value={event} onChange={change => setEvent(change.target.value)}><option value="all">All events & club partners</option><option value="club">Club partners</option>{events.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div>
    {loading ? <p role="status" className="club-notice">Loading sponsors...</p> : error ? <div role="alert" className="club-notice">{error}<button type="button" onClick={retry}>Try again</button></div> : filtered.length ? <SponsorGroups sponsors={filtered} /> : <p className="club-notice">{data.length ? 'No sponsors match these filters.' : 'Sponsors and community partners will appear here once published.'}</p>}
  </div>;
}