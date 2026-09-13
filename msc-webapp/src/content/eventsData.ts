import type { ClubEvent } from '../components/public/types';
import season2Media from './season2Media.json';

export const eventsData: readonly ClubEvent[] = [
  {
    id: 'orientation-season-2',
    title: 'Microsoft Orientation Day Season 2',
    category: 'Orientation',
    summary: 'Eleven stations. One gamified scorecard. A community learning together.',
    description: 'Microsoft Orientation Day Season 2 took place on December 1, 2025. The event featured an 11-station gamified scorecard system designed to engage attendees as they explored the community.',
    startsAt: '2025-12-01',
    location: null,
    status: 'past',
    imageUrl: season2Media[0].src,
    gallery: season2Media.map(image => image.src),
  },
  {
    id: 'canal-startup-sprint',
    title: 'Canal Startup Sprint Hackathon',
    category: 'Hackathon',
    summary: 'From student ideas to startup MVPs, in collaboration with Creativa.',
    description: 'Running across July and August 2026, Canal Startup Sprint Hackathon was an intensive bootcamp guiding students through building startup minimum viable products (MVPs), in collaboration with Creativa.',
    startsAt: '2026-07',
    endsAt: '2026-08',
    location: null,
    status: 'past',
    imageUrl: null,
    gallery: [],
  },
  {
    id: 'orientation-season-3',
    title: 'Microsoft Orientation Day Season 3',
    category: 'Orientation',
    summary: 'The community comes together for its next massive seasonal kickoff.',
    description: 'Join Microsoft Orientation Day Season 3, the massive seasonal kickoff for the community, on October 19, 2026, from 3 PM to 7 PM at Creativa Innovation Hub Ismailia. All times are local to Cairo.',
    startsAt: '2026-10-19T15:00:00+03:00',
    endsAt: '2026-10-19T19:00:00+03:00',
    location: 'Creativa Innovation Hub Ismailia',
    status: 'upcoming',
    imageUrl: null,
    gallery: [],
  },
];