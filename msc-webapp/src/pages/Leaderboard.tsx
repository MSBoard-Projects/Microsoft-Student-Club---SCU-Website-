import { useDeferredValue, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiAward, FiSearch } from 'react-icons/fi';
import { leaderboardApi } from '../services/api';
import { useShowcase } from '../context/ShowcaseContext';
import usePublishedCollection from '../hooks/usePublishedCollection';
import { parseRatings, rankMembers, scoreLabels } from '../content/ratings';
import OptimizedImage from '../components/public/OptimizedImage';
import Icon from '../components/public/Icon';

const loadRatings = () => leaderboardApi.getAll();
const score = (value: number | null) => value === null ? 'Not reported' : `${value.toLocaleString('en-GB', { maximumFractionDigits: 2 })} / 100`;
const periodDate = (value: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));

export function MemberRatings({ memberId }: { memberId: string }) {
  const { data, loading, error, retry } = usePublishedCollection(loadRatings, parseRatings);
  const periods = data.filter(period => period.entries.some(entry => entry.memberId === memberId));
  return <section className="club-profile-ratings"><h2>Rating history</h2>
    {loading ? <p role="status">Loading ratings...</p> : error ? <p role="alert">{error}<button type="button" onClick={retry}>Try again</button></p> : periods.length ? <ul>{periods.map(period => <li key={period.id}><Link to={`/leaderboard?period=${period.id}&member=${encodeURIComponent(memberId)}`}>{period.title}</Link><strong>{score(period.entries.find(entry => entry.memberId === memberId)!.rate)}</strong></li>)}</ul> : <p>No ratings published yet.</p>}
    <Link to="/leaderboard" className="club-text-link">Leaderboard <Icon glyph={FiArrowRight} /></Link>
  </section>;
}

export default function Leaderboard() {
  const { data: { members } } = useShowcase();
  const { data: periods, loading, error, retry } = usePublishedCollection(loadRatings, parseRatings);
  const [parameters] = useSearchParams();
  const [selected, setSelected] = useState(parameters.get('period') || '');
  const [search, setSearch] = useState(parameters.get('member') || '');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [group, setGroup] = useState('all');
  const [page, setPage] = useState(1);
  const period = periods.find(item => String(item.id) === selected) ?? periods[0];
  const ranked = rankMembers(period, members, group);
  const filtered = ranked.filter(entry => `${entry.member.fullName} ${entry.member.positionTitle} ${entry.memberId}`.toLowerCase().includes(query));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 12, currentPage * 12);
  return <div className="club-container club-directory">
    <header className="club-page-heading"><span className="club-eyebrow">MICROSOFT STUDENT CLUB / SCU</span><h1>Leaderboard</h1><p>Members and leaders, recognised for their contribution.</p></header>
    <div className="club-event-toolbar club-ranking-toolbar">
      <div className="club-event-search"><Icon glyph={FiSearch} /><input aria-label="Search leaderboard" placeholder="Name or role" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div>
      <label className="club-event-filter"><span className="sr-only">Rating period</span><select aria-label="Rating period" value={period?.id ?? ''} onChange={event => { setSelected(event.target.value); setPage(1); }} disabled={!periods.length}>{!periods.length && <option value="">No published periods</option>}{periods.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label className="club-event-filter"><span className="sr-only">Leaderboard group</span><select aria-label="Leaderboard group" value={group} onChange={event => { setGroup(event.target.value); setPage(1); }}><option value="all">Members & Board</option><option value="member">Members</option><option value="board">Board & High Board</option></select></label>
    </div>
    {loading ? <p role="status" className="club-notice">Loading leaderboard...</p> : error ? <div role="alert" className="club-notice">{error}<button type="button" onClick={retry}>Try again</button></div> : !period ? <p className="club-notice">No ratings have been published yet.</p> : <>
      <div className="club-ranking-period"><h2>{period.title}</h2><p>{periodDate(period.startDate)} - {periodDate(period.endDate)}</p><p>Updated {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' }).format(new Date(period.publishedAt))} (Cairo)</p></div>
      <p className="club-result-count" aria-live="polite">{filtered.length} rated people</p>
      {!visible.length ? <p className="club-notice">No rated people match your search.</p> : <ol className="club-ranking-list">{visible.map(entry => <li key={entry.memberId} value={entry.rank}>
        <Link to={`/members/${encodeURIComponent(entry.memberId)}`} className="club-ranking-row" aria-label={`Rank ${entry.rank}: ${entry.member.fullName}, ${entry.rate} out of 100`}>
          <span className="club-rank">{entry.rank <= 3 && <Icon glyph={FiAward} />}<span>{entry.rank}</span></span>
          <span className="club-ranking-avatar">{entry.member.imageUrl ? <OptimizedImage src={entry.member.imageUrl} alt="" fit="contain" aspectRatio="1" framed={false} sizes="48px" /> : <span aria-hidden="true">{entry.member.fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>}</span>
          <span className="club-ranking-person"><strong>{entry.member.fullName}</strong><small>{entry.member.positionTitle}</small></span><strong className="club-ranking-score">{entry.rate}<small>/ 100</small></strong>
        </Link>
        <details className="club-rating-breakdown"><summary>Score breakdown</summary><dl>{Object.entries(scoreLabels).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{score(entry[key as keyof typeof scoreLabels])}</dd></div>)}</dl></details>
      </li>)}</ol>}
      {pageCount > 1 && <nav className="club-pagination" aria-label="Leaderboard pages"><button type="button" title="Previous page" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><Icon glyph={FiArrowLeft} /></button><span>{currentPage} / {pageCount}</span><button type="button" title="Next page" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><Icon glyph={FiArrowRight} /></button></nav>}
    </>}
  </div>;
}