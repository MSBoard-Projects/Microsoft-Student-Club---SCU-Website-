import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiAward, FiSearch, FiX } from 'react-icons/fi';
import records from '../content/goldenData.json';
import { canonicalMemberId, ClubMember } from '../content/members';
import { useShowcase } from '../context/ShowcaseContext';
import OptimizedImage from '../components/public/OptimizedImage';
import Icon from '../components/public/Icon';

type GoldenCategory = 'heads' | 'instructors' | 'members';
interface GoldenRecipient { id: string; name: string; memberId: string | null; awards: { month: string; category: GoldenCategory; role: string }[] }
export const goldenRecipients = records as GoldenRecipient[];
export const recurringRecipients = goldenRecipients.filter(person => new Set(person.awards.map(award => award.month)).size > 1);
const categories: Record<GoldenCategory, string> = { heads: 'Golden Heads', instructors: 'Golden Instructors', members: 'Golden Members' };
const monthLabel = (month: string) => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`));

export function resolveGoldenMember(person: GoldenRecipient, members: readonly ClubMember[]) {
  const memberId = person.memberId ? canonicalMemberId(person.memberId) : null;
  return members.find(member => member.id === memberId);
}

function GoldenGroups({ people, month = 'all' }: { people: GoldenRecipient[]; month?: string }) {
  const { data: { members } } = useShowcase();
  return <>{(Object.keys(categories) as GoldenCategory[]).map(category => {
    const group = people.filter(person => (person.awards.find(award => award.month === month) ?? person.awards[0]).category === category);
    return group.length ? <section key={category} className="club-golden-group" aria-label={categories[category]}><h2>{categories[category]} <span>{group.length}</span></h2><div className="club-golden-grid">{group.map(person => {
      const member = resolveGoldenMember(person, members);
      const name = member?.fullName ?? person.name;
      const award = person.awards.find(item => item.month === month) ?? person.awards[0];
      return <article key={person.id} className="club-golden-card">
        <div className="club-golden-photo">{member?.imageUrl ? <OptimizedImage src={member.imageUrl} alt={name} fit="contain" aspectRatio="1" framed={false} sizes="(max-width: 760px) 100vw, 360px" /> : <span className="club-member-initials" aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>}<span className="club-golden-badge"><Icon glyph={FiAward} />{person.awards.length} {person.awards.length === 1 ? 'recognition' : 'recognitions'}</span></div>
        <div className="club-golden-copy"><h3>{member ? <Link to={`/members/${encodeURIComponent(member.id)}`}>{name}</Link> : name}</h3><p>{member?.positionTitle ?? award.role}</p><div className="club-golden-months">{person.awards.map(item => <span key={item.month}>{monthLabel(item.month)}</span>)}</div></div>
      </article>;
    })}</div></section> : null;
  })}</>;
}

export function RecurringGoldenSection() {
  return <section className="club-section club-golden club-golden-theme" aria-labelledby="recurring-golden-title"><div className="club-container"><div className="club-section-heading"><div><span className="club-eyebrow">FEBRUARY & APRIL 2026</span><h2 id="recurring-golden-title">Excellence, recognised again.</h2><p>{recurringRecipients.length} people recognised in both months.</p></div><Link className="club-text-link" to="/golden-members">All golden honourees <Icon glyph={FiArrowUpRight} /></Link></div><GoldenGroups people={recurringRecipients} /></div></section>;
}

export default function GoldenMembers() {
  const { data: { members } } = useShowcase();
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState('all');
  const [recurring, setRecurring] = useState(false);
  const months = [...new Set(goldenRecipients.flatMap(person => person.awards.map(award => award.month)))].sort().reverse();
  const people = (recurring ? recurringRecipients : goldenRecipients).filter(person => {
    const award = month === 'all' ? person.awards[0] : person.awards.find(item => item.month === month);
    const member = resolveGoldenMember(person, members);
    return award && (category === 'all' || award.category === category) && `${member?.fullName ?? person.name} ${member?.positionTitle ?? award.role}`.toLowerCase().includes(query);
  });
  return <div className="club-golden-theme"><div className="club-container club-directory">
    <header className="club-page-heading"><span className="club-eyebrow">MICROSOFT STUDENT CLUB / SCU</span><h1>Golden Honours</h1><p>Our Golden Heads, Instructors and Members. February & April 2026.</p></header>
    <div className="club-directory-segments" role="group" aria-label="Golden category">{[['all', 'All honourees'], ...Object.entries(categories)].map(([value, label]) => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div>
    <div className="club-event-toolbar"><div className="club-event-search"><Icon glyph={FiSearch} /><input aria-label="Search golden honourees" value={search} placeholder="Name or committee" onChange={event => setSearch(event.target.value)} />{search && <button type="button" title="Clear search" aria-label="Clear search" onClick={() => setSearch('')}><Icon glyph={FiX} /></button>}</div><label className="club-event-filter"><span className="sr-only">Recognition month</span><select value={month} onChange={event => setMonth(event.target.value)}><option value="all">All months</option>{months.map(value => <option key={value} value={value}>{monthLabel(value)}</option>)}</select></label><label className="club-golden-repeat"><input type="checkbox" checked={recurring} onChange={event => setRecurring(event.target.checked)} />Recognised in both months</label></div>
    <p className="club-result-count" aria-live="polite">{people.length} honourees</p>
    {people.length ? <GoldenGroups people={people} month={month} /> : <p className="club-notice">No honourees match these filters.</p>}
  </div></div>;
}