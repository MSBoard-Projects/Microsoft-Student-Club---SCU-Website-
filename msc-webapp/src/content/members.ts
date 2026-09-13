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
}

export const members: readonly ClubMember[] = records.map(record => {
  const group = record.group;
  if (group !== 'member' && group !== 'instructor' && group !== 'board' && group !== 'high-board') throw new Error(`Invalid member group: ${group}`);
  return { ...record, group, ...(record.id === 'ali-arabi-ali' ? { bio: 'AI & Machine Learning Engineer \uD83E\uDD16 | Microsoft Certified AI-900 | Github Campus Expert\uD83D\uDEA9 | Software Engineer \uD83D\uDCBB | UI/UX Designer\uD83C\uDFA8| Microsoft Student Ambassador\uD83D\uDC31\u200D\uD83C\uDFCD| Best Speaker among 18 Egyptian Universities in 2024\uD83C\uDFA4' } : {}) };
});

const leadershipOrder = (member: ClubMember) => member.positionTitle.toLowerCase() === 'president' ? 0 : member.positionTitle.toLowerCase() === 'vice president' ? 1 : 2;
export const getHighBoard = (records: readonly ClubMember[]) => records.filter(member => member.group === 'high-board').sort((first, second) => leadershipOrder(first) - leadershipOrder(second));
export const highBoard = getHighBoard(members);