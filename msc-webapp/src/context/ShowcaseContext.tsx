import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { clubContent } from '../content/club';
import { members, publicContactFields, type ClubMember } from '../content/members';
import { achievements, type StudentAchievement } from '../content/achievements';
import type { ClubEvent, ClubStatistics, EventSource } from '../components/public/types';
import { showcaseApi } from '../services/api';

declare const process: { env: { REACT_APP_CONTENT_SOURCE?: string } };

export interface ShowcaseData { events: readonly ClubEvent[]; members: readonly ClubMember[]; achievements: readonly StudentAchievement[]; statistics: ClubStatistics }
export const localShowcase: ShowcaseData = { events: clubContent.events, members, achievements, statistics: clubContent.statistics };
const emptyShowcase: ShowcaseData = { events: [], members: [], achievements: [], statistics: { registeredAttendees: null, beneficiaries: null, eventLocations: null, eventsConducted: null } };
const ShowcaseContext = createContext({ data: localShowcase, loading: false, error: '', source: 'local' as EventSource, refresh: () => {} });
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string';
const optionalText = (value: unknown) => value === null || text(value);
const stringList = (value: unknown) => Array.isArray(value) && value.every(text);

export function parseShowcase(value: unknown): ShowcaseData {
  if (!object(value) || !Array.isArray(value.events) || !Array.isArray(value.members) || !Array.isArray(value.achievements) || !object(value.statistics)) throw new Error('Invalid content response');
  if (!value.events.every(item => object(item) && ['id', 'title', 'summary', 'description', 'category'].every(key => text(item[key])) && optionalText(item.imageUrl) && optionalText(item.startsAt) && (item.endsAt === undefined || optionalText(item.endsAt)) && optionalText(item.location) && stringList(item.gallery) && ['past', 'upcoming', 'unannounced'].includes(String(item.status)))) throw new Error('Invalid event data');
  if (!value.members.every(item => object(item) && ['id', 'fullName', 'positionTitle'].every(key => text(item[key])) && ['member', 'instructor', 'board', 'high-board'].includes(String(item.group)) && optionalText(item.imageUrl) && optionalText(item.certificateUrl) && (item.bio === undefined || optionalText(item.bio)))) throw new Error('Invalid member data');
  if (!value.events.every(item => item.registrationUrl === undefined || optionalText(item.registrationUrl))) throw new Error('Invalid registration data');
  if (!value.members.every(item => publicContactFields.every(field => item[field.key] === undefined || optionalText(item[field.key])))) throw new Error('Invalid public contact data');
  if (!value.achievements.every(item => object(item) && ['id', 'title', 'summary'].every(key => text(item[key])) && stringList(item.studentNames) && optionalText(item.achievedAt) && optionalText(item.imageUrl) && optionalText(item.evidenceUrl))) throw new Error('Invalid achievement data');
  for (const key of ['registeredAttendees', 'beneficiaries', 'eventLocations', 'eventsConducted']) {
    const total = value.statistics[key];
    if (total !== null && !(typeof total === 'number' && Number.isSafeInteger(total) && total >= 0)) throw new Error('Invalid statistics');
  }
  return value as unknown as ShowcaseData;
}

export function ShowcaseProvider({ children, source = process.env.REACT_APP_CONTENT_SOURCE === 'api' ? 'api' : clubContent.eventSource }: { children: ReactNode; source?: EventSource }) {
  const { pathname } = useLocation();
  const [data, setData] = useState(source === 'local' ? localShowcase : emptyShowcase);
  const [loading, setLoading] = useState(source === 'api');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    if (source === 'local') { setData(localShowcase); setLoading(false); setError(''); return undefined; }
    setLoading(true); setError('');
    showcaseApi.get().then((response: unknown) => { const parsed = parseShowcase(response); if (active) setData(parsed); })
      .catch(() => { if (active) { setData(emptyShowcase); setError('Content could not be loaded. Please try again.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [source, pathname, revision]);
  return <ShowcaseContext.Provider value={{ data, loading, error, source, refresh: () => setRevision(value => value + 1) }}>{children}</ShowcaseContext.Provider>;
}

export function useShowcase() { return useContext(ShowcaseContext); }

export function PublicContentGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { loading, error, refresh } = useShowcase();
  if (!pathname.startsWith('/admin')) {
    if (loading) return <div className="club-container club-notice" role="status">Loading community content...</div>;
    if (error) return <div className="club-container club-notice" role="alert">{error}<button type="button" onClick={refresh}>Try again</button></div>;
  }
  return <>{children}</>;
}