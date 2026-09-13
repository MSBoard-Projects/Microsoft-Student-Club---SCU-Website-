import { FiAward, FiArrowUpRight } from 'react-icons/fi';
import type { StudentAchievement } from '../content/achievements';
import { useShowcase } from '../context/ShowcaseContext';
import { formatEventDate } from '../components/public/EventCollection';
import OptimizedImage from '../components/public/OptimizedImage';
import Icon from '../components/public/Icon';

export default function Achievements({ entries: suppliedEntries }: { entries?: readonly StudentAchievement[] }) {
  const { data } = useShowcase();
  const entries = suppliedEntries ?? data.achievements;
  return <div className="club-container club-catalogue">
    <header className="club-page-heading"><span className="club-eyebrow">BUILT BY OUR COMMUNITY</span><h1>Student Achievements</h1><p>Recognising the work, ideas, and milestones of our students.</p></header>
    {entries.length ? <div className="club-event-grid">{entries.map(achievement => <article key={achievement.id} className="club-event-card">
      <OptimizedImage src={achievement.imageUrl} alt={achievement.title} className="club-event-photo" framed={false} />
      <div className="club-event-copy"><span className="club-eyebrow">{formatEventDate(achievement.achievedAt)}</span><h2 className="club-achievement-title">{achievement.title}</h2><p className="club-achievement-people">{achievement.studentNames.join(', ')}</p><p className="club-detail-description">{achievement.summary}</p>
        {achievement.evidenceUrl && /^https:\/\//i.test(achievement.evidenceUrl) && <a href={achievement.evidenceUrl} target="_blank" rel="noopener noreferrer" className="club-text-link">View achievement <Icon glyph={FiArrowUpRight} /></a>}
      </div>
    </article>)}</div> : <section className="club-achievements-empty"><Icon glyph={FiAward} /><h2>Great things take shape here.</h2><p>No student achievements have been published yet.</p></section>}
  </div>;
}