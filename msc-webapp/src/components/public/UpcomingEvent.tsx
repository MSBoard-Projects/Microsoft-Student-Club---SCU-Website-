import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import type { ClubEvent } from './types';
import { formatEventSchedule } from './EventCollection';
import Icon from './Icon';

export function countdownTarget(startsAt: string | null): number | null {
  if (!startsAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(startsAt)) return null;
  const target = Date.parse(startsAt);
  return Number.isFinite(target) ? target : null;
}

export default function UpcomingEvent({ event }: { event: ClubEvent | undefined }) {
  const target = countdownTarget(event?.startsAt ?? null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (target === null || target <= Date.now()) return undefined;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= target) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [target]);
  if (!event) return null;
  const remaining = target === null ? null : Math.max(0, Math.ceil((target - now) / 1000));
  const units = remaining === null ? [] : [
    { label: 'Days', value: Math.floor(remaining / 86400) },
    { label: 'Hours', value: Math.floor(remaining / 3600) % 24 },
    { label: 'Minutes', value: Math.floor(remaining / 60) % 60 },
    { label: 'Seconds', value: remaining % 60 },
  ];
  return <section className="club-upcoming" aria-label="Next club event"><div className="club-container club-upcoming-layout">
    <div><span className="club-eyebrow">NEXT UP / {formatEventSchedule(event)}</span><h2>{event.title}</h2><p>{event.summary}</p><Link to={`/events/${encodeURIComponent(event.id)}`} className="club-text-link">Explore the event <Icon glyph={FiArrowUpRight} /></Link></div>
    {remaining === null ? <p className="club-schedule-pending">{formatEventSchedule(event)}<span>Exact day and time to be announced</span></p> : remaining === 0 ? <p className="club-schedule-pending">Scheduled start reached<span>See event details for updates</span></p> : <div className="club-countdown" role="timer" aria-label={`Countdown to ${event.title}`}>
      {units.map(unit => <div key={unit.label}><strong>{String(unit.value).padStart(2, '0')}</strong><span>{unit.label}</span></div>)}
    </div>}
  </div></section>;
}