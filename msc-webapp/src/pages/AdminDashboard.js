import React, { useDeferredValue, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiCalendar, FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch, FiStar, FiUsers } from 'react-icons/fi';
import { eventsApi, membersApi } from '../services/api';
import PageTransition from '../components/PageTransition';
import './AdminDashboard.css';

const initialResource = { status: 'loading', items: [] };
const pageSize = 5;
const groups = [{ id: 1, name: 'High Board', color: 'blue' }, { id: 2, name: 'Board', color: 'green' }, { id: 3, name: 'Golden Member', color: 'gold' }];

function resourceFrom(result) {
  return result.status === 'fulfilled' && Array.isArray(result.value)
    ? { status: 'ready', items: result.value } : { status: 'error', items: [] };
}

function dateLabel(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not set';
}

function Metric({ label, count, resource, icon: Icon, to, color }) {
  return <Link className={`overview-metric metric-${color}`} to={to}>
    <div className="metric-top"><Icon aria-hidden="true" /><FiArrowUpRight aria-hidden="true" /></div>
    <span className="metric-label">{label}</span>
    {resource.status === 'loading' ? <span className="overview-skeleton metric-placeholder" aria-label={`Loading ${label}`} />
      : <strong className="metric-value">{resource.status === 'error' ? 'Unavailable' : count}</strong>}
  </Link>;
}

export default function AdminDashboard() {
  const [members, setMembers] = useState(initialResource);
  const [events, setEvents] = useState(initialResource);
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;
    setMembers(initialResource);
    setEvents(initialResource);
    Promise.allSettled([membersApi.getAll(), eventsApi.getAll()]).then(([memberResult, eventResult]) => {
      if (active) {
        setMembers(resourceFrom(memberResult));
        setEvents(resourceFrom(eventResult));
        setPage(0);
      }
    });
    return () => { active = false; };
  }, [revision]);

  const loading = members.status === 'loading' || events.status === 'loading';
  const upcoming = events.items.filter(event => event.isUpcoming);
  const filteredEvents = events.items
    .filter(event => (tab === 'all' || event.isUpcoming) && (event.title || '').toLowerCase().includes(query))
    .sort((first, second) => tab === 'upcoming' ? new Date(first.eventDate) - new Date(second.eventDate) : new Date(second.eventDate) - new Date(first.eventDate));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filteredEvents.length / pageSize) - 1));
  const visibleEvents = filteredEvents.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const refresh = () => setRevision(value => value + 1);

  return <PageTransition><div className="club-overview">
    <header className="overview-heading">
      <div><p className="overview-eyebrow">MICROSOFT STUDENT CLUB / SCU</p><h1>Club overview</h1></div>
      <div className="overview-actions">
        <button type="button" className="overview-icon-button" onClick={refresh} disabled={loading} aria-label="Refresh overview" title="Refresh overview"><FiRefreshCw className={loading ? 'overview-spinning' : ''} aria-hidden="true" /></button>
        <Link className="overview-primary" to="/admin/events"><FiCalendar aria-hidden="true" />Manage events<FiArrowUpRight aria-hidden="true" /></Link>
      </div>
    </header>
    <section aria-label="Club statistics" className="overview-metrics" aria-busy={loading}>
      <Metric label="Club members" count={members.items.length} resource={members} icon={FiUsers} to="/admin/members" color="blue" />
      <Metric label="Total events" count={events.items.length} resource={events} icon={FiCalendar} to="/admin/events" color="green" />
      <Metric label="Upcoming events" count={upcoming.length} resource={events} icon={FiArrowUpRight} to="/admin/events" color="cyan" />
      <Metric label="Featured events" count={events.items.filter(event => event.isFeatured).length} resource={events} icon={FiStar} to="/admin/events" color="gold" />
    </section>
    <div className="overview-columns">
      <section className="overview-events" aria-labelledby="events-heading">
        <div className="overview-section-title"><h2 id="events-heading">Event schedule</h2><Link to="/admin/events" className="overview-text-link">View all<FiArrowUpRight aria-hidden="true" /></Link></div>
        <div className="overview-filters">
          <div className="overview-segments" role="group" aria-label="Filter events">
            <button type="button" aria-pressed={tab === 'upcoming'} onClick={() => { setTab('upcoming'); setPage(0); }}>Upcoming</button>
            <button type="button" aria-pressed={tab === 'all'} onClick={() => { setTab('all'); setPage(0); }}>All events</button>
          </div>
          <label className="overview-search"><FiSearch aria-hidden="true" /><span className="sr-only">Search events</span><input type="search" placeholder="Search events" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label>
        </div>
        <div className="overview-event-list" aria-busy={events.status === 'loading'}>
          {events.status === 'loading' && <div role="status" aria-label="Loading events">{[0, 1, 2].map(index => <div key={index} className="overview-event-skeleton"><span className="overview-skeleton" /><span className="overview-skeleton" /></div>)}</div>}
          {events.status === 'error' && <div role="alert" className="overview-empty"><FiCalendar aria-hidden="true" /><h3>Events could not be loaded</h3><button type="button" className="overview-text-link" onClick={refresh} disabled={loading}><FiRefreshCw aria-hidden="true" />Try again</button></div>}
          {events.status === 'ready' && visibleEvents.length === 0 && <div className="overview-empty"><FiCalendar aria-hidden="true" /><h3>{query ? 'No matching events' : tab === 'upcoming' ? 'No upcoming events' : 'No events yet'}</h3>
            {query ? <button className="overview-text-link" onClick={() => { setSearch(''); setPage(0); }}>Clear search</button> : <Link className="overview-text-link" to="/admin/events">Manage events<FiArrowUpRight aria-hidden="true" /></Link>}
          </div>}
          {visibleEvents.map(event => <article key={event.id} className="overview-event-row">
            <div className="overview-event-visual"><FiCalendar aria-hidden="true" />{event.imageUrl && <img src={event.imageUrl} alt="" loading="lazy" onError={failure => { failure.currentTarget.hidden = true; }} />}</div>
            <div className="overview-event-info"><h3>{event.title}</h3><time dateTime={event.eventDate}>{dateLabel(event.eventDate)}</time></div>
            <span className={`overview-status ${event.isUpcoming ? 'status-upcoming' : 'status-past'}`}>{event.isUpcoming ? 'Upcoming' : 'Past'}</span>
            <Link to="/admin/events" className="overview-icon-button" aria-label={`Manage ${event.title}`} title={`Manage ${event.title}`}><FiArrowUpRight aria-hidden="true" /></Link>
          </article>)}
        </div>
        {events.status === 'ready' && filteredEvents.length > 0 && <div className="overview-pagination"><span aria-live="polite">{currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, filteredEvents.length)} of {filteredEvents.length} events</span><div>
          <button className="overview-icon-button" aria-label="Previous page" title="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><FiChevronLeft aria-hidden="true" /></button>
          <button className="overview-icon-button" aria-label="Next page" title="Next page" disabled={(currentPage + 1) * pageSize >= filteredEvents.length} onClick={() => setPage(currentPage + 1)}><FiChevronRight aria-hidden="true" /></button>
        </div></div>}
      </section>
      <section className="overview-roster" aria-labelledby="roster-heading">
        <div className="overview-section-title"><h2 id="roster-heading">The team</h2><Link to="/admin/members" className="overview-icon-button" title="Manage members" aria-label="Manage members"><FiArrowUpRight aria-hidden="true" /></Link></div>
        {members.status === 'loading' && <div role="status" aria-label="Loading members" className="overview-roster-loading"><span className="overview-skeleton" /><span className="overview-skeleton" /><span className="overview-skeleton" /></div>}
        {members.status === 'error' && <div className="overview-empty" role="alert"><FiUsers aria-hidden="true" /><h3>Members could not be loaded</h3><button type="button" className="overview-text-link" onClick={refresh} disabled={loading}>Try again</button></div>}
        {members.status === 'ready' && <>
          <ul className="overview-group-list">{groups.map(group => {
            const count = members.items.filter(member => member.memberTypeId === group.id || member.memberType?.typeName === group.name).length;
            return <li key={group.id}><div><span className={`overview-group-dot dot-${group.color}`} />{group.name}<strong>{count}</strong></div><meter aria-label={`${group.name} members`} min="0" max={Math.max(1, members.items.length)} value={count}>{count}</meter></li>;
          })}</ul>
          {members.items.length === 0 ? <p className="overview-muted">No club members yet.</p> : <div className="overview-member-preview">{members.items.slice(0, 5).map(member => <div key={member.id} className="overview-member-avatar" title={member.fullName}>
            <span>{(member.fullName || '?').split(' ').slice(0, 2).map(part => part[0]).join('')}</span>{member.imageUrl && <img src={member.imageUrl} alt={member.fullName} loading="lazy" onError={failure => { failure.currentTarget.hidden = true; }} />}
          </div>)}<span>{members.items.length} members</span></div>}
          <Link className="overview-roster-link" to="/admin/members">Open member directory<FiArrowUpRight aria-hidden="true" /></Link>
        </>}
        <div className="overview-deferred"><span className="overview-eyebrow">ATTENDANCE & REWARDS</span><h3>Not connected yet</h3><p>QR check-in, attendance points, and certificates are unavailable.</p></div>
      </section>
    </div>
  </div></PageTransition>;
}
