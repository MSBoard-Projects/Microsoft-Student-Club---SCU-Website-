export const sponsorTiers = { diamond: 'Diamond', gold: 'Gold', silver: 'Silver', bronze: 'Bronze', community: 'Community partners' } as const;
export type SponsorTier = keyof typeof sponsorTiers;
export interface SponsorRecord { id: number; name: string; tier: SponsorTier; logoUrl: string; websiteUrl: string | null; description: string | null; eventKey: string | null; eventTitle: string | null; displayOrder: number; isPublished: boolean }

export function parseSponsors(value: unknown): SponsorRecord[] {
  if (!Array.isArray(value)) throw new Error('Invalid sponsors response');
  const safeUrl = (url: unknown) => typeof url === 'string' && !url.includes('\\') && ![...url].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) && (/^\/(?!\/)/.test(url) || /^https:\/\//i.test(url));
  const optionalText = (text: unknown) => text === null || typeof text === 'string';
  const ids = new Set<number>();
  for (const sponsor of value) {
    if (!sponsor || !Number.isInteger(sponsor.id) || ids.has(sponsor.id) || typeof sponsor.name !== 'string' || !Object.keys(sponsorTiers).includes(sponsor.tier) ||
      !safeUrl(sponsor.logoUrl) || (sponsor.websiteUrl !== null && !safeUrl(sponsor.websiteUrl)) || ![sponsor.description, sponsor.eventKey, sponsor.eventTitle].every(optionalText) ||
      !Number.isInteger(sponsor.displayOrder) || sponsor.displayOrder < 0 || sponsor.isPublished !== true) throw new Error('Invalid published sponsor');
    ids.add(sponsor.id);
  }
  return [...value].sort((first, second) => first.displayOrder - second.displayOrder || first.name.localeCompare(second.name));
}