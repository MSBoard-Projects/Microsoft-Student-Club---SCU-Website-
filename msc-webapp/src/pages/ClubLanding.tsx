import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { clubContent } from '../content/club';
import { communityAlbums } from '../content/communityAlbums';
import HeroSection from '../components/public/HeroSection';
import StatisticsBanner from '../components/public/StatisticsBanner';
import UpcomingEvent from '../components/public/UpcomingEvent';
import CommunityMoments from '../components/public/CommunityMoments';
import { SupporterPrograms, SupporterWall } from '../components/public/Supporters';
import { HighBoardSection } from './MemberDirectory';
import { RecurringGoldenSection } from './GoldenMembers';
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
      <SupporterPrograms />
      <StatisticsBanner statistics={statistics ?? data.statistics} />
      <UpcomingEvent event={events.filter(event => event.status === 'upcoming').sort((first, second) => (first.startsAt ?? '9999').localeCompare(second.startsAt ?? '9999'))[0]} />
      <section className="club-section" id="club-events">
        <div className="club-container">
          <div className="club-section-heading"><div><span className="club-eyebrow">EXPERIENCES THAT STAY WITH YOU</span><h2>Off the syllabus.</h2><p>Real people. New perspectives. A community that takes learning further.</p></div><Link to="/events" className="club-text-link">All events <Icon glyph={FiArrowUpRight} /></Link></div>
          {loading ? <div className="club-notice" role="status">Loading events...</div> : error ? <div className="club-notice" role="alert">{error}<button type="button" onClick={retry}>Try again</button></div> : events.length ? <EventGrid events={events.slice(0, 3)} onSelect={setSelected} /> : <p className="club-notice">No events published yet.</p>}
        </div>
      </section>
      <CommunityMoments events={[...communityAlbums, ...events]} onSelect={setSelected} />
      <HighBoardSection />
      <section className="club-section club-story" id="club-story">
        <div className="club-container club-story-grid">
          <GlassImage src="/club-media/hero-orientation.jpg" alt="Club members sharing a moment at orientation" className="club-story-photo" position="center 35%" />
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="club-eyebrow">MORE THAN A STUDENT CLUB</span><h2>About Us</h2>
            <p>Microsoft Student Club is a dynamic and innovative community dedicated to empowering students and professionals through technology, leadership, and entrepreneurial initiatives.</p>
            <h3 className="club-goals-title">Our Goals</h3>
            <div className="club-story-lines"><div><span>01</span>Build a bridge between academia and industry by creating spaces for innovation and collaboration.</div><div><span>02</span>Enhance students' skills through workshops, hackathons, and community-driven initiatives.</div><div><span>03</span>Provide tools and resources to develop leadership and entrepreneurial skills.</div></div>
            <Link to="/members" className="club-text-link">Meet the community <Icon glyph={FiArrowUpRight} /></Link>
          </motion.div>
        </div>
        <div className="club-container club-purpose-grid"><div><h3>Vision</h3><p>Creating a dynamic student community where Microsoft technologies fuel innovation, leadership, and real-world impact, bridging the gap between academia and industry.</p></div><div><h3>Mission</h3><p>To provide hands-on learning opportunities, networking platforms, and real-world project experiences that empower students to develop cutting-edge skills and become future leaders in the tech and business world.</p></div></div>
      </section>
      <RecurringGoldenSection />
      <SupporterWall />
      {selected && <EventDetails key={selected.id} event={selected} onClose={() => setSelected(null)} />}
    </>
  );
}