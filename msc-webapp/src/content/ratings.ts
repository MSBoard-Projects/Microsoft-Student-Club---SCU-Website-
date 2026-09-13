import type { ClubMember } from './members';

export interface RatingEntry { memberId: string; rate: number; onlineAttendance: number | null; offlineAttendance: number | null; tasks: number | null; projects: number | null }
export interface RatingPeriod { id: number; title: string; startDate: string; endDate: string; publishedAt: string; version: string; entries: RatingEntry[] }
export const scoreLabels = { onlineAttendance: 'Online attendance', offlineAttendance: 'Offline attendance', tasks: 'Tasks', projects: 'Projects' } as const;

export function parseRatings(value: unknown): RatingPeriod[] {
  if (!Array.isArray(value)) throw new Error('Invalid ratings response');
  const validScore = (score: unknown) => typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100;
  const ids = new Set<number>();
  for (const period of value) {
    if (!period || !Number.isInteger(period.id) || ids.has(period.id) || typeof period.title !== 'string' ||
      ![period.startDate, period.endDate].every(date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date))) ||
      period.startDate > period.endDate || typeof period.publishedAt !== 'string' || !Number.isFinite(Date.parse(period.publishedAt)) || typeof period.version !== 'string' || !Array.isArray(period.entries)) throw new Error('Invalid rating period');
    ids.add(period.id);
    const members = new Set<string>();
    for (const entry of period.entries) {
      if (!entry || typeof entry.memberId !== 'string' || members.has(entry.memberId) || !validScore(entry.rate) ||
        !Object.keys(scoreLabels).every(key => entry[key] === null || validScore(entry[key]))) throw new Error('Invalid member rating');
      members.add(entry.memberId);
    }
  }
  return [...value].sort((first, second) => second.endDate.localeCompare(first.endDate) || second.startDate.localeCompare(first.startDate));
}

export function rankMembers(period: RatingPeriod | undefined, members: readonly ClubMember[], group = 'all') {
  const eligible = new Map(members.filter(member => member.group !== 'instructor' && (group === 'all' || member.group === group || group === 'board' && member.group === 'high-board')).map(member => [member.id, member]));
  const sorted = (period?.entries ?? []).flatMap(entry => {
    const member = eligible.get(entry.memberId);
    return member ? [{ ...entry, member }] : [];
  }).sort((first, second) => second.rate - first.rate || first.member.fullName.localeCompare(second.member.fullName) || first.memberId.localeCompare(second.memberId));
  let previousRate: number | undefined;
  let rank = 0;
  return sorted.map((entry, index) => {
    if (entry.rate !== previousRate) rank = index + 1;
    previousRate = entry.rate;
    return { ...entry, rank };
  });
}