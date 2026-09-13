import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { clubContent } from '../content/club';
import HeroSection from '../components/public/HeroSection';
import StatisticsBanner from '../components/public/StatisticsBanner';
import UpcomingEvent from '../components/public/UpcomingEvent';
import CommunityMoments from '../components/public/CommunityMoments';
import { HighBoardSection } from './MemberDirectory';
import { GoldenMembersSection } from './Leaderboard';
import GlassImage from '../components/public/GlassImage';
import Icon from '../components/public/Icon';
import { EventDetails, EventGrid, useEventCatalog } from '../components/public/EventCollection';
import type { ClubEvent, ClubStatistics } from '../components/public/types';
import { useShowcase } from '../context/ShowcaseContext';

export default function ClubLanding({ statistics }: { statistics?: ClubStatistics }) {
  const { data } = useShowcase();
  const { events, loading, error, retry } = useEventCatalog();
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const reducedMotion = useReducedMotion();
  return (
    <>
      <HeroSection assets={clubContent.assets} />
      <StatisticsBanner statistics={statistics ?? data.statistics} />
      <UpcomingEvent event={events.filter(event => event.status === 'upcoming').sort((first, second) => (first.startsAt ?? '9999').localeCompare(second.startsAt ?? '9999'))[0]} />
      <section className="club-section" id="club-events">
        <div className="club-container">
          <div className="club-section-heading"><div><span className="club-eyebrow">EXPERIENCES THAT STAY WITH YOU</span><h2>Off the syllabus.</h2><p>Real people. New perspectives. A community that takes learning further.</p></div><Link to="/events" className="club-text-link">All events <Icon glyph={FiArrowUpRight} /></Link></div>
          {loading ? <div className="club-notice" role="status">Loading events...</div> : error ? <div className="club-notice" role="alert">{error}<button type="button" onClick={retry}>Try again</button></div> : events.length ? <EventGrid events={events.slice(0, 3)} onSelect={setSelected} /> : <p className="club-notice">No events published yet.</p>}
        </div>
      </section>
      <CommunityMoments events={events} onSelect={setSelected} />
      <HighBoardSection />
      <GoldenMembersSection />
      <section className="club-section club-story" id="club-story">
        <div className="club-container club-story-grid">
          <GlassImage src="/club-media/hero-orientation.jpg" alt="Club members sharing a moment at orientation" className="club-story-photo" position="center 35%" />
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="club-eyebrow">MORE THAN A STUDENT CLUB</span><h2>Your curiosity.<br />Our collective energy.</h2>
            <p>We are the Microsoft Student Club at Suez Canal University. A place to exchange ideas, grow your skills, and build alongside people who are just as curious as you.</p>
            <div className="club-story-lines"><div><span>01</span>Learn beyond the classroom</div><div><span>02</span>Turn ideas into shared projects</div><div><span>03</span>Find a community to grow with</div></div>
            <Link to="/members" className="club-text-link">Meet the community <Icon glyph={FiArrowUpRight} /></Link>
          </motion.div>
        </div>
      </section>
      {selected && <EventDetails key={selected.id} event={selected} onClose={() => setSelected(null)} />}
    </>
  );
}