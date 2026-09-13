export type ThemeName = 'night' | 'day' | 'forest';
export type EventSource = 'local' | 'api';

export interface ClubEvent {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  imageUrl: string | null;
  gallery: readonly string[];
  startsAt: string | null;
  endsAt?: string | null;
  location: string | null;
  status: 'upcoming' | 'past' | 'unannounced';
}

export interface ClubStatistics {
  registeredAttendees: number | null;
  eventLocations: number | null;
  beneficiaries: number | null;
  eventsConducted: number | null;
}

export interface ClubAssets {
  logo: string | null;
  hero: string | null;
  heroAlt: string;
  heroGallery?: readonly { src: string; alt: string; label: string }[];
  community: string | null;
}

export interface ClubContent {
  assets: ClubAssets;
  statistics: ClubStatistics;
  events: readonly ClubEvent[];
  eventSource: EventSource;
}