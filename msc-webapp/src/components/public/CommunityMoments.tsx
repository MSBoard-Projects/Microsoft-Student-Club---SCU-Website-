import { useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiPause, FiPlay } from 'react-icons/fi';
import type { ClubEvent } from './types';
import GlassImage from './GlassImage';
import Icon from './Icon';

export default function CommunityMoments({ events, onSelect }: { events: readonly ClubEvent[]; onSelect: (event: ClubEvent) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: '100px' });
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const photos = events.flatMap(event => [...new Set(event.gallery.length ? event.gallery : event.imageUrl ? [event.imageUrl] : [])]
    .filter(Boolean).map((src, index) => ({ src, event, label: `${event.title}, photo ${index + 1}` })));
  if (!photos.length) return null;
  const rows = [photos.filter((_, index) => index % 2 === 0), photos.filter((_, index) => index % 2 === 1)];
  if (!rows[1].length) rows[1] = rows[0];
  return <section ref={sectionRef} className="club-section club-moments" aria-labelledby="community-moments-title" data-paused={paused || !inView || Boolean(reducedMotion)}>
    <div className="club-container club-section-heading"><div><span className="club-eyebrow">LIFE AT MICROSOFT STUDENT CLUB</span><h2 id="community-moments-title">Moments we share.</h2></div><div className="club-moments-actions">
      {!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play photo animation' : 'Pause photo animation'} title={paused ? 'Play photo animation' : 'Pause photo animation'}><Icon glyph={paused ? FiPlay : FiPause} /></button>}
      <Link to="/gallery" className="club-text-link">All photos <Icon glyph={FiArrowUpRight} /></Link>
    </div></div>
    <div className="club-moments-rows">{rows.map((row, rowIndex) => {
      const tiles = Array.from({ length: Math.max(8, row.length) }, (_, index) => row[index % row.length]);
      return <div className="club-moments-window" key={rowIndex} onFocus={event => event.target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.scrollLeft = 0; }}>
        <div className={`club-moments-track ${rowIndex === 1 ? 'club-moments-reverse' : ''}`}>
          <div className="club-moments-group">{tiles.map((photo, index) => <button type="button" className="club-moment" key={`${photo.src}-${index}`} aria-label={`View album: ${photo.label}`} onClick={() => onSelect(photo.event)}><GlassImage src={photo.src} alt={photo.label} sizes="300px" fit="contain" framed={false} /><span>{photo.event.title}<Icon glyph={FiArrowUpRight} /></span></button>)}</div>
          <div className="club-moments-group club-moments-copy" aria-hidden="true">{tiles.map((photo, index) => <button type="button" tabIndex={-1} className="club-moment" key={`${photo.src}-${index}`} onPointerDown={event => event.preventDefault()} onClick={() => onSelect(photo.event)}><GlassImage src={photo.src} alt="" sizes="300px" fit="contain" framed={false} /><span>{photo.event.title}<Icon glyph={FiArrowUpRight} /></span></button>)}</div>
        </div>
      </div>;
    })}</div>
  </section>;
}