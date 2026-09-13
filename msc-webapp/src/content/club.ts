import type { ClubContent } from '../components/public/types';
import { eventsData } from './eventsData';
import { teamPhoto } from './communityAlbums';

export const clubContent: ClubContent = {
  eventSource: 'local',
  assets: {
    logo: '/club-media/club-logo.png',
    hero: teamPhoto,
    heroAlt: 'The Microsoft Student Club team together at orientation',
    heroGallery: [
      { src: teamPhoto!, alt: 'The Microsoft Student Club team together at orientation', label: 'All Team' },
      { src: '/club-media/microsoft-egypt.jpg', alt: 'Microsoft Student Club members together at Microsoft Egypt', label: 'Microsoft Egypt' },
      { src: '/club-media/hero-orientation.jpg', alt: 'Students gathering at the club orientation', label: 'Orientation' },
      { src: '/club-media/community.jpg', alt: 'The Microsoft Student Club community together on campus', label: 'Our community' },
    ],
    community: '/club-media/community.jpg',
  },
  statistics: {
    registeredAttendees: 8000,
    eventLocations: null,
    beneficiaries: 8000,
    eventsConducted: eventsData.filter(event => event.status === 'past').length,
  },
  events: eventsData,
};