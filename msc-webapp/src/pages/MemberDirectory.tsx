import { useDeferredValue, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiDownload, FiFacebook, FiFileText, FiGithub, FiGlobe, FiInstagram, FiLinkedin, FiMail, FiPhone, FiSearch, FiX } from 'react-icons/fi';
import { getHighBoard, memberContactLinks, type ClubMember, type MemberGroup } from '../content/members';
import { useShowcase } from '../context/ShowcaseContext';
import OptimizedImage from '../components/public/OptimizedImage';
import Icon from '../components/public/Icon';
import { MemberRatings } from './Leaderboard';

const groupLabels: Record<MemberGroup, string> = { 'high-board': 'High Board', board: 'Board', member: 'Members', instructor: 'Instructors' };

export function MemberSocialLinks({ member }: { member: ClubMember }) {
  const links = memberContactLinks(member);
  const icons = { githubUrl: FiGithub, linkedInUrl: FiLinkedin, facebookUrl: FiFacebook, instagramUrl: FiInstagram, websiteUrl: FiGlobe, publicEmail: FiMail, publicPhone: FiPhone };
  if (!links.length) return null;
  return <div className="club-member-socials" role="group" aria-label={`Contact ${member.fullName}`}>{links.map(link => <a key={link.key} href={link.href} aria-label={`${link.label}: ${member.fullName}`} title={link.label} {...(link.href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Icon glyph={icons[link.key]} /></a>)}</div>;
}

export function MemberCard({ member }: { member: ClubMember }) {
  const initials = member.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('');
  return <article className="club-member-card">
    <Link className="club-member-profile-link" to={`/members/${encodeURIComponent(member.id)}`} aria-label={`View profile: ${member.fullName}`}><div className="club-member-portrait">
      {member.imageUrl ? <OptimizedImage src={member.imageUrl} alt={member.fullName} aspectRatio="1" fit="contain" sizes="(max-width: 760px) 100vw, 300px" framed={false} /> : <span className="club-member-initials" aria-hidden="true">{initials}</span>}
      <span className="club-member-group">{groupLabels[member.group]}</span>
    </div></Link>
    <div className="club-member-copy"><h3><Link to={`/members/${encodeURIComponent(member.id)}`}><bdi>{member.fullName}</bdi></Link></h3><p>{member.positionTitle}</p>
      <MemberSocialLinks member={member} />
      {member.certificateUrl ? <div className="club-member-certificate">
        <a href={member.certificateUrl} target="_blank" rel="noopener noreferrer" aria-label={`View certificate: ${member.fullName}`}><Icon glyph={FiFileText} />Certificate PDF</a>
        <a href={member.certificateUrl} download title={`Download certificate: ${member.fullName}`} aria-label={`Download certificate: ${member.fullName}`}><Icon glyph={FiDownload} /></a>
      </div> : <span className="club-member-pending">Certificate not published</span>}
    </div>
  </article>;
}

export function HighBoardSection() {
  const highBoard = getHighBoard(useShowcase().data.members);
  return <section className="club-section club-leadership-preview" aria-labelledby="home-leadership-title"><div className="club-container">
    <div className="club-section-heading"><div><span className="club-eyebrow">THE PEOPLE BEHIND THE COMMUNITY</span><h2 id="home-leadership-title">Meet the High Board</h2></div><Link to="/leadership" className="club-text-link">Our leadership <Icon glyph={FiArrowUpRight} /></Link></div>
    <div className="club-officers">{highBoard.map(member => <article key={member.id} className={`club-officer ${member.positionTitle.toLowerCase() === 'president' ? 'club-officer-president' : ''}`}>
      <Link className="club-officer-photo" to={`/members/${encodeURIComponent(member.id)}`} aria-label={`View profile: ${member.fullName}`}>{member.imageUrl ? <OptimizedImage src={member.imageUrl} alt={member.fullName} fit="contain" aspectRatio="1" framed={false} sizes="(max-width: 760px) 100vw, 400px" /> : <span className="club-member-initials" aria-hidden="true">{member.fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>}</Link>
      <div className="club-officer-copy"><span className="club-eyebrow">{member.positionTitle}</span><h3><Link to={`/members/${encodeURIComponent(member.id)}`}><bdi>{member.fullName}</bdi></Link></h3>{member.bio && <p dir="auto">{member.bio}</p>}<MemberSocialLinks member={member} /><Link to={`/members/${encodeURIComponent(member.id)}`} className="club-text-link">View profile <Icon glyph={FiArrowUpRight} /></Link></div>
    </article>)}</div>
  </div></section>;
}

function Directory({ leadership }: { leadership: boolean }) {
  const { data: { members } } = useShowcase();
  const highBoard = getHighBoard(members);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim().toLowerCase());
  const [group, setGroup] = useState<MemberGroup>('member');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const source = leadership ? members.filter(member => member.group === 'high-board' || member.group === 'board') : members.filter(member => member.group === group);
  const roles = [...new Set(source.map(member => member.positionTitle))].sort();
  const filtered = source.filter(member => (role === 'all' || member.positionTitle === role) && `${member.fullName} ${member.positionTitle}`.toLowerCase().includes(query));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 12, currentPage * 12);
  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  return <div className="club-container club-directory">
    <header className="club-page-heading"><span className="club-eyebrow">MICROSOFT STUDENT CLUB / SCU</span><h1>{leadership ? 'Our Leadership' : 'Our Members'}</h1><p>{leadership ? 'The High Board and Board bringing our community together.' : 'The people learning, creating, and contributing to our community.'}</p></header>
    {!leadership && <div className="club-directory-segments" role="group" aria-label="Member category">{(['member', 'instructor'] as const).map(category => <button key={category} type="button" aria-pressed={group === category} onClick={() => { setGroup(category); setRole('all'); setPage(1); }}>{groupLabels[category]} <span>{members.filter(member => member.group === category).length}</span></button>)}</div>}
    <div className="club-event-toolbar">
      <div className="club-event-search"><Icon glyph={FiSearch} /><input aria-label="Search people" placeholder="Search by name or role" value={search} onChange={event => changeSearch(event.target.value)} />{search && <button type="button" title="Clear search" aria-label="Clear search" onClick={() => changeSearch('')}><Icon glyph={FiX} /></button>}</div>
      <label className="club-event-filter"><span className="sr-only">Filter by role</span><select value={role} onChange={event => { setRole(event.target.value); setPage(1); }}><option value="all">All roles</option>{roles.map(position => <option key={position} value={position}>{position}</option>)}</select></label>
    </div>
    <p className="club-result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'person' : 'people'}{!leadership && filtered.length > 0 ? ` / Page ${currentPage} of ${pageCount}` : ''}</p>
    {!filtered.length ? <p className="club-notice">No people match your search.</p> : leadership ? <>
      {(['high-board', 'board'] as const).map(category => {
        const groupMembers = category === 'high-board' ? highBoard.filter(member => filtered.some(item => item.id === member.id)) : filtered.filter(member => member.group === category);
        return groupMembers.length ? <section className="club-directory-section" key={category} aria-label={groupLabels[category]}><h2>{groupLabels[category]} <span>{groupMembers.length}</span></h2><div className="club-member-grid">{groupMembers.map(member => <MemberCard key={member.id} member={member} />)}</div></section> : null;
      })}
    </> : <><div className="club-member-grid">{visible.map(member => <MemberCard key={member.id} member={member} />)}</div>
      {pageCount > 1 && <nav className="club-pagination" aria-label="Member pages"><button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" title="Previous page"><Icon glyph={FiArrowLeft} /></button><span>Page {currentPage} of {pageCount}</span><button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="Next page" title="Next page"><Icon glyph={FiArrowRight} /></button></nav>}
    </>}
  </div>;
}

export default function MembersPage() { return <Directory leadership={false} />; }
export function LeadershipPage() { return <Directory leadership />; }

export function MemberProfile() {
  const { id } = useParams();
  const member = useShowcase().data.members.find(person => person.id === id);
  if (!member) return <div className="club-container club-notice"><h1>Member not found</h1><Link to="/members">Back to members</Link></div>;
  return <div className="club-container club-directory">
    <Link className="club-text-link" to={member.group === 'board' || member.group === 'high-board' ? '/leadership' : '/members'}><Icon glyph={FiArrowLeft} />Back to people</Link>
    <section className="club-member-profile" aria-labelledby="member-profile-title">
      <div className="club-profile-portrait">{member.imageUrl ? <OptimizedImage src={member.imageUrl} alt={member.fullName} fit="contain" aspectRatio="1" priority framed={false} /> : <span className="club-member-initials" aria-hidden="true">{member.fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span>}</div>
      <div><span className="club-eyebrow">{groupLabels[member.group]}</span><h1 id="member-profile-title"><bdi>{member.fullName}</bdi></h1><p className="club-profile-role">{member.positionTitle}</p><h2>About</h2><p className="club-profile-bio" dir="auto">{member.bio || 'No biography published yet.'}</p>
        <MemberSocialLinks member={member} />
        {member.certificateUrl && <a className="club-text-link" href={member.certificateUrl} target="_blank" rel="noopener noreferrer"><Icon glyph={FiFileText} />View certificate</a>}
        <MemberRatings memberId={member.id} />
      </div>
    </section>
  </div>;
}