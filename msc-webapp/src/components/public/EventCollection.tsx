import { useDeferredValue, useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCalendar, FiMapPin, FiSearch, FiX } from 'react-icons/fi';
import { eventsApi } from '../../services/api';
import { clubContent } from '../../content/club';
import type { ClubEvent, EventSource } from './types';
import GlassImage from './GlassImage';
import Icon from './Icon';
import { useShowcase } from '../../context/ShowcaseContext';
import { EventSponsors } from '../../pages/Sponsors';

export function parseApiEvents(data: unknown): ClubEvent[] {
  if (!Array.isArray(data)) throw new Error('Invalid events response');
  return data.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Invalid event');
    const event = value as Record<string, unknown>;
    if ((typeof event.id !== 'number' && typeof event.id !== 'string') || typeof event.title !== 'string') throw new Error('Invalid event');
    const description = typeof event.description === 'string' && event.description.trim() ? event.description : 'Details have not been published yet.';
    const imageUrl = typeof event.imageUrl === 'string' && event.imageUrl ? event.imageUrl : null;
    return {
      id: String(event.id), title: event.title, summary: description, description,
      category: event.isFeatured === true ? 'Featured' : 'Club event', imageUrl, gallery: imageUrl ? [imageUrl] : [],
      startsAt: typeof event.eventDate === 'string' ? event.eventDate : null,
      location: typeof event.location === 'string' && event.location ? event.location : null,
      status: event.isUpcoming === true ? 'upcoming' : 'past',
    };
  });
}

export function useEventCatalog(source?: EventSource) {
  const showcase = useShowcase();
  const [events, setEvents] = useState<ClubEvent[]>(source === 'local' ? [...clubContent.events] : []);
  const [loading, setLoading] = useState(source === 'api');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (source === undefined) return undefined;
    let active = true;
    if (source === 'local') {
      setEvents([...clubContent.events]); setLoading(false); setError('');
      return undefined;
    }
    setLoading(true); setError('');
    eventsApi.getAll().then((data: unknown) => {
      const parsed = parseApiEvents(data);
      if (active) setEvents(parsed);
    }).catch(() => {
      if (active) setError('Failed to load events. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [source, revision]);
  return source === undefined ? { events: [...showcase.data.events], loading: showcase.loading, error: showcase.error, retry: showcase.refresh } : { events, loading, error, retry: () => setRevision(value => value + 1) };
}

export function formatEventDate(value: string | null, detailed = false): string {
  if (!value) return 'Date not published';
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T12:00:00Z`));
  }
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return 'Date not published';
  const hasTime = detailed && value.includes('T');
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Cairo',
    ...(hasTime ? { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' } as const : {}),
  }).format(date);
}

export function formatEventSchedule(event: ClubEvent, detailed = false): string {
  return `${formatEventDate(event.startsAt, detailed)}${event.endsAt ? ` - ${formatEventDate(event.endsAt, detailed)}` : ''}`;
}

export function EventGrid({ events, onSelect }: { events: readonly ClubEvent[]; onSelect: (event: ClubEvent) => void }) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="club-event-grid">
      {events.map((event, index) => (
        <motion.article key={event.id} className="club-event-card" initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.5, delay: Math.min(index, 3) * 0.08 }}>
          <GlassImage src={event.imageUrl} alt={event.title} className="club-event-photo" framed={false} position="center 32%" sizes="(max-width: 760px) 100vw, 33vw" />
          <div className="club-event-copy">
            <div className="club-event-tags"><span>{event.category}</span><span>{event.status === 'upcoming' ? 'Upcoming' : event.status === 'past' ? 'Past event' : 'Schedule pending'}</span></div>
            <h3><button type="button" className="club-event-open" onClick={() => onSelect(event)} aria-label={`View details: ${event.title}`}>{event.title}<Icon glyph={FiArrowUpRight} /></button></h3>
            <p className="club-event-summary">{event.summary}</p>
            <div className="club-event-meta"><Icon glyph={FiCalendar} /><span>{formatEventSchedule(event)}</span></div>
            <Link className="club-text-link club-event-permalink" to={`/events/${encodeURIComponent(event.id)}`} aria-label={`Event page: ${event.title}`}>Event page <Icon glyph={FiArrowUpRight} /></Link>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export function EventGallery({ event }: { event: ClubEvent }) {
  const [photo, setPhoto] = useState(0);
  const images = event.gallery.length ? event.gallery : event.imageUrl ? [event.imageUrl] : [];
  const current = Math.min(photo, Math.max(0, images.length - 1));
  return <div className="club-event-gallery">
    <GlassImage src={images[current] ?? null} alt={`${event.title}, photo ${current + 1}`} className="club-detail-photo" fit="contain" framed={false} priority />
    {images.length > 1 && <>
      <div className="club-gallery-controls">
        <button type="button" aria-label="Previous photo" title="Previous photo" onClick={() => setPhoto((current + images.length - 1) % images.length)}><Icon glyph={FiArrowLeft} /></button>
        <span aria-live="polite">{current + 1} / {images.length}</span>
        <button type="button" aria-label="Next photo" title="Next photo" onClick={() => setPhoto((current + 1) % images.length)}><Icon glyph={FiArrowRight} /></button>
      </div>
      <div className="club-photo-picker" role="group" aria-label="Event photos">
        {images.map((image, index) => <button key={`${image}-${index}`} type="button" aria-label={`Show photo ${index + 1}`} title={`Show photo ${index + 1}`} aria-pressed={current === index} onClick={() => setPhoto(index)}><GlassImage src={image} alt="" sizes="66px" framed={false} /></button>)}
      </div>
    </>}
  </div>;
}

function EventBody({ event }: { event: ClubEvent }) {
  return <>
    <EventGallery key={event.id} event={event} />
    <div className="club-detail-facts">
      <div><Icon glyph={FiCalendar} /><span><strong>WHEN</strong>{formatEventSchedule(event, true)}</span></div>
      <div><Icon glyph={FiMapPin} /><span><strong>WHERE</strong>{event.location || 'Location not published'}</span></div>
    </div>
    <p className="club-detail-description">{event.description}</p>
  </>;
}

export function EventPage({ source }: { source?: EventSource }) {
  const { id } = useParams();
  const { events, loading, error, retry } = useEventCatalog(source);
  const event = events.find(item => item.id === id);
  useEffect(() => {
    const previousTitle = document.title;
    if (event) document.title = `${event.title} | Microsoft Student Club`;
    return () => { document.title = previousTitle; };
  }, [event]);
  return <div className="club-container club-event-page">
    <Link to="/events" className="club-text-link"><Icon glyph={FiArrowLeft} />All events</Link>
    {loading ? <p role="status" className="club-notice">Loading event...</p> : error ? <div role="alert" className="club-notice">{error}<button type="button" onClick={retry}>Try again</button></div> : event ? <article>
      <header className="club-page-heading"><span className="club-eyebrow">{event.category}</span><h1>{event.title}</h1><p>{event.summary}</p></header>
      <EventBody event={event} />
      <EventSponsors eventId={event.id} />
    </article> : <div className="club-page-heading"><h1>Event not found</h1><p>This event may no longer be available.</p></div>}
  </div>;
}

export function EventDetails({ event, onClose }: { event: ClubEvent; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = 'hidden';
    return () => {
      if (dialog?.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} className="club-event-dialog"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); } }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      <div className="club-dialog-heading"><span className="club-eyebrow">{event.category}</span><button type="button" onClick={onClose} aria-label="Close event details" title="Close event details"><Icon glyph={FiX} /></button></div>
      <div className="club-dialog-body">
        <h2 id={titleId}>{event.title}</h2>
        <EventBody event={event} />
        <Link to={`/events/${encodeURIComponent(event.id)}`} className="club-text-link" onClick={onClose}>Open event page <Icon glyph={FiArrowUpRight} /></Link>
      </div>
    </dialog>
  );
}

export function GalleryPage({ source }: { source?: EventSource }) {
  const { events, loading, error, retry } = useEventCatalog(source);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const albums = events.map(event => ({ ...event, gallery: [...new Set(event.gallery.length ? event.gallery : event.imageUrl ? [event.imageUrl] : [])] }))
    .filter(event => event.gallery.length > 0);
  const filtered = albums.filter(event => `${event.title} ${event.category} ${event.location ?? ''}`.toLowerCase().includes(query));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, pageCount);
  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  return <div className="club-container club-catalogue">
    <header className="club-page-heading"><span className="club-eyebrow">MICROSOFT STUDENT CLUB / SCU</span><h1>Photo Gallery</h1><p>Shared experiences, captured by our community.</p></header>
    <div className="club-event-toolbar"><div className="club-event-search"><Icon glyph={FiSearch} /><input type="text" aria-label="Search albums" placeholder="Find an album" value={search} onChange={event => changeSearch(event.target.value)} />{search && <button type="button" title="Clear search" aria-label="Clear search" onClick={() => changeSearch('')}><Icon glyph={FiX} /></button>}</div><Link to="/events" className="club-text-link">All events <Icon glyph={FiArrowUpRight} /></Link></div>
    {loading ? <p className="club-notice" role="status">Loading albums...</p> : error ? <div className="club-notice" role="alert">{error}<button type="button" onClick={retry}>Try again</button></div> : <>
      <p className="club-result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'album' : 'albums'} / {filtered.reduce((total, event) => total + event.gallery.length, 0)} photos</p>
      {filtered.length ? <div className="club-album-grid">{filtered.slice((currentPage - 1) * 6, currentPage * 6).map(event => <article key={event.id} className="club-album">
        <button type="button" className="club-album-cover" aria-label={`Open album: ${event.title}`} onClick={() => setSelected(event)}><GlassImage src={event.gallery[0]} alt={event.title} fit="contain" framed={false} sizes="(max-width: 760px) 100vw, (max-width: 1050px) 50vw, 33vw" /><span>{event.gallery.length} {event.gallery.length === 1 ? 'photo' : 'photos'}<Icon glyph={FiArrowUpRight} /></span></button>
        <h2><Link to={`/events/${encodeURIComponent(event.id)}`}>{event.title}</Link></h2><p>{formatEventSchedule(event)}</p>
      </article>)}</div> : <p className="club-notice">{search ? 'No albums match your search.' : 'No photo albums published yet.'}</p>}
      {pageCount > 1 && <nav className="club-pagination" aria-label="Album pages"><button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" title="Previous page"><Icon glyph={FiArrowLeft} /></button><span aria-live="polite">Page {currentPage} of {pageCount}</span><button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="Next page" title="Next page"><Icon glyph={FiArrowRight} /></button></nav>}
    </>}
    {selected && <EventDetails key={selected.id} event={selected} onClose={() => setSelected(null)} />}
  </div>;
}

export default function EventCollection({ source }: { source?: EventSource }) {
  const { events, loading, error, retry } = useEventCatalog(source);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [filter, setFilter] = useState('all');
  const [year, setYear] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const eventYear = (event: ClubEvent) => event.startsAt && formatEventDate(event.startsAt) !== 'Date not published' ? event.startsAt.slice(0, 4) : 'undated';
  const years = [...new Set(events.map(eventYear).filter(value => value !== 'undated'))].sort().reverse();
  const categories = [...new Set(events.map(event => event.category))].sort();
  const filtered = events.filter(event => (filter === 'all' || event.status === filter)
    && (year === 'all' || eventYear(event) === year) && (category === 'all' || event.category === category)
    && `${event.title} ${event.description} ${event.category} ${event.location ?? ''}`.toLowerCase().includes(query));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 6, currentPage * 6);
  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  const resetFilters = () => { setSearch(''); setFilter('all'); setYear('all'); setCategory('all'); setPage(1); };
  return (
    <div className="club-catalogue club-container">
      <header className="club-page-heading"><span className="club-eyebrow">CURIOUS MINDS. SHARED EXPERIENCES.</span><h1>Our Events</h1><p>Get closer to the ideas, people, and experiences that make this community.</p><Link className="club-text-link" to="/gallery">Photo gallery <Icon glyph={FiArrowUpRight} /></Link></header>
      <div className="club-event-toolbar">
        <div className="club-event-search"><Icon glyph={FiSearch} /><input type="text" aria-label="Search events" placeholder="Find your next inspiration" value={search} onChange={event => changeSearch(event.target.value)} />
          {search && <button type="button" onClick={() => changeSearch('')} aria-label="Clear search" title="Clear search"><Icon glyph={FiX} /></button>}
        </div>
        <label className="club-event-filter"><span className="sr-only">Filter events:</span><select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="all">All Events</option><option value="upcoming">Upcoming Events</option><option value="past">Past Events</option><option value="unannounced">Schedule pending</option></select></label>
        <label className="club-event-filter"><span className="sr-only">Event year</span><select value={year} onChange={event => { setYear(event.target.value); setPage(1); }}><option value="all">All years</option>{years.map(value => <option key={value} value={value}>{value}</option>)}{events.some(event => eventYear(event) === 'undated') && <option value="undated">Date not published</option>}</select></label>
        <label className="club-event-filter"><span className="sr-only">Event category</span><select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="all">All categories</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        {(search || filter !== 'all' || year !== 'all' || category !== 'all') && <button type="button" className="club-text-link" onClick={resetFilters}><Icon glyph={FiX} />Reset filters</button>}
      </div>
      {loading ? <div className="club-notice" role="status">Loading events...</div> : error ? <div className="club-notice" role="alert">{error}<button type="button" onClick={retry}>Try again</button></div> : <>
        <p className="club-result-count" aria-live="polite">Showing {filtered.length} of {events.length} events</p>
        {filtered.length ? <EventGrid events={visible} onSelect={setSelected} /> : <div className="club-notice">{search ? `No events found matching "${search}"` : 'No events found.'}</div>}
        {pageCount > 1 && <nav className="club-pagination" aria-label="Event pages"><button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" title="Previous page"><Icon glyph={FiArrowLeft} /></button><span aria-live="polite">Page {currentPage} of {pageCount}</span><button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="Next page" title="Next page"><Icon glyph={FiArrowRight} /></button></nav>}
      </>}
      {selected && <EventDetails key={selected.id} event={selected} onClose={() => setSelected(null)} />}
      <Link className="club-text-link" to="/sponsors">Sponsors & community partners <Icon glyph={FiArrowUpRight} /></Link>
    </div>
  );
}