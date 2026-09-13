import records from './membersData.json';

export type MemberGroup = 'member' | 'instructor' | 'board' | 'high-board';

export interface ClubMember {
  id: string;
  fullName: string;
  positionTitle: string;
  group: MemberGroup;
  imageUrl: string | null;
  certificateUrl: string | null;
  bio?: string | null;
  githubUrl?: string | null;
  linkedInUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
}

export const publicContactFields = [
  { key: 'githubUrl', label: 'GitHub', type: 'url' },
  { key: 'linkedInUrl', label: 'LinkedIn', type: 'url' },
  { key: 'facebookUrl', label: 'Facebook', type: 'url' },
  { key: 'instagramUrl', label: 'Instagram', type: 'url' },
  { key: 'websiteUrl', label: 'Website', type: 'url' },
  { key: 'publicEmail', label: 'Public email', type: 'email' },
  { key: 'publicPhone', label: 'Public phone (+country code)', type: 'tel' },
] as const;

export function memberContactLinks(member: Partial<ClubMember>) {
  return publicContactFields.flatMap(field => {
    const raw = member[field.key];
    if (typeof raw !== 'string' || !raw.trim()) return [];
    const value = raw.trim();
    let href = '';
    if (field.type === 'email') {
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) return [];
      href = `mailto:${value}`;
    } else if (field.type === 'tel') {
      if (!/^\+[1-9]\d{6,14}$/.test(value)) return [];
      href = `tel:${value}`;
    } else {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) return [];
        href = url.href;
      } catch { return []; }
    }
    return [{ key: field.key, label: field.label, href }];
  });
}

export const members: readonly ClubMember[] = records.map(record => {
  const group = record.group;
  if (group !== 'member' && group !== 'instructor' && group !== 'board' && group !== 'high-board') throw new Error(`Invalid member group: ${group}`);
  return { ...record, group, ...(record.id === 'ali-arabi-ali' ? { bio: 'AI & Machine Learning Engineer \uD83E\uDD16 | Microsoft Certified AI-900 | Github Campus Expert\uD83D\uDEA9 | Software Engineer \uD83D\uDCBB | UI/UX Designer\uD83C\uDFA8| Microsoft Student Ambassador\uD83D\uDC31\u200D\uD83C\uDFCD| Best Speaker among 18 Egyptian Universities in 2024\uD83C\uDFA4' } : {}) };
});

const leadershipOrder = (member: ClubMember) => member.positionTitle.toLowerCase() === 'president' ? 0 : member.positionTitle.toLowerCase() === 'vice president' ? 1 : 2;
export const getHighBoard = (records: readonly ClubMember[]) => records.filter(member => member.group === 'high-board').sort((first, second) => leadershipOrder(first) - leadershipOrder(second));
export const highBoard = getHighBoard(members);