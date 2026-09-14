import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { FiUsers, FiMapPin, FiHeart, FiCalendar } from 'react-icons/fi';
import type { ClubStatistics } from './types';
import Icon from './Icon';

export function Counter({ value, suffix = '' }: { value: number | null; suffix?: string }) {
  const target = value !== null && Number.isSafeInteger(Math.floor(value)) && value >= 0 ? Math.floor(value) : null;
  const element = useRef<HTMLSpanElement>(null);
  const inView = useInView(element, { once: true, amount: 0.4 });
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (target === null || !inView || reducedMotion) return undefined;
    setDisplayValue(0);
    const animation = animate(0, target, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: current => setDisplayValue(Math.round(current)) });
    return () => animation.stop();
  }, [target, inView, reducedMotion]);

  return (
    <span ref={element} className="club-counter" aria-label={target === null ? 'Not published' : `${target.toLocaleString('en-US')}${suffix}`}>
      <span aria-hidden="true">{target === null ? '--' : `${(reducedMotion ? target : displayValue).toLocaleString('en-US', target >= 10000 ? { notation: 'compact', maximumFractionDigits: 1 } : {})}${suffix}`}</span>
    </span>
  );
}

export default function StatisticsBanner({ statistics }: { statistics: ClubStatistics }) {
  const reducedMotion = useReducedMotion();
  const metrics = [
    { key: 'registeredAttendees', label: 'Students at our events', icon: FiUsers, value: statistics.registeredAttendees },
    { key: 'eventLocations', label: 'Event Locations', icon: FiMapPin, value: statistics.eventLocations },
    { key: 'beneficiaries', label: 'Community & group members reached', icon: FiHeart, value: statistics.beneficiaries },
    { key: 'eventsConducted', label: 'Events, workshops & sessions', icon: FiCalendar, value: statistics.eventsConducted },
  ].filter(metric => metric.key !== 'eventLocations' || metric.value !== null).map(metric => ({ ...metric, value: metric.value !== null && Number.isSafeInteger(Math.floor(metric.value)) && metric.value >= 0 ? metric.value : null }));

  return (
    <section className="club-statistics" aria-label="Community statistics">
      <div className="club-container">
        <div className="club-stats-heading"><span className="club-eyebrow">A COMMUNITY IN MOTION</span><span>Small beginnings. Shared impact.</span></div>
        <div className={`club-stats-grid club-stats-count-${metrics.length}`}>
          {metrics.map((metric, index) => (
            <motion.div key={metric.key} className={`club-stat club-stat-${index}`} initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.5 }}>
              <Icon glyph={metric.icon} className="club-stat-icon" />
              <Counter value={metric.value} suffix={metric.key === 'eventsConducted' ? '+' : ''} />
              <h2>{metric.label}</h2>
              {metric.value === null && <span className="club-stat-status">Not published yet</span>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}