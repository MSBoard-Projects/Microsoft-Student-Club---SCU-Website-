import media from './communityMedia.json';
import type { ClubEvent } from '../components/public/types';

export const communityAlbums: ClubEvent[] = media.map(album => ({
  id: album.id, title: album.title, summary: '', description: '', category: 'Photo album',
  imageUrl: album.photos[0]?.src ?? null, gallery: album.photos.map(photo => photo.src),
  startsAt: null, location: null, status: 'unannounced',
}));
export const isCommunityAlbum = (event: ClubEvent) => communityAlbums.some(album => album.id === event.id);
export const teamPhoto = media.find(album => album.title === 'Microsoft Oriantation 2')?.photos.find(photo => photo.isTeam)?.src ?? null;