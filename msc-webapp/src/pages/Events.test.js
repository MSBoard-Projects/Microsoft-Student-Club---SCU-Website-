import React from 'react';
import { act, fireEvent, render as testingRender, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Events, { EventPage, EventGallery, GalleryPage, formatEventDate, formatEventSchedule } from '../components/public/EventCollection';
import UpcomingEvent, { countdownTarget } from '../components/public/UpcomingEvent';
import { eventsData } from '../content/eventsData';
import { eventsApi } from '../services/api';

const render = element => testingRender(<MemoryRouter>{element}</MemoryRouter>);

jest.mock('../services/api', () => ({ eventsApi: { getAll: jest.fn() } }));

const events = [
  { id: 1, title: 'Cloud workshop', description: 'Build a web application', eventDate: '2026-10-20', isUpcoming: true },
  { id: 2, title: 'Community meetup', description: null, eventDate: '2026-08-01', isUpcoming: false },
];

beforeEach(() => eventsApi.getAll.mockResolvedValue(events));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

afterAll(() => {
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});

test('combines trimmed case-insensitive search and event filters', async () => {
  render(<Events source="api" />);
  await screen.findByRole('heading', { name: 'Cloud workshop' });
  fireEvent.change(screen.getByRole('textbox', { name: 'Search events' }), { target: { value: '  WEB  ' } });
  expect(await screen.findByText('Showing 1 of 2 events')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Community meetup' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter events:' }), { target: { value: 'past' } });
  expect(await screen.findByText('Showing 0 of 2 events')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search events' }), { target: { value: '' } });
  expect(await screen.findByRole('heading', { name: 'Community meetup' })).toBeInTheDocument();
});

test('failure is not displayed as an empty event catalogue and retry recovers', async () => {
  eventsApi.getAll.mockRejectedValueOnce(new Error('offline'));
  render(<Events source="api" />);
  expect(await screen.findByText('Failed to load events. Please try again.')).toBeInTheDocument();
  expect(screen.queryByText('No events found.')).not.toBeInTheDocument();
  expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: 'Cloud workshop' })).toBeInTheDocument();
});

test('invalid API responses show a recoverable error', async () => {
  eventsApi.getAll.mockResolvedValue({ message: 'not an array' });
  render(<Events source="api" />);
  expect(await screen.findByText('Failed to load events. Please try again.')).toBeInTheDocument();
});

test('real event cards open full details and restore focus on Escape', () => {
  render(<Events />);
  expect(eventsApi.getAll).not.toHaveBeenCalled();
  const trigger = screen.getByRole('button', { name: 'View details: Microsoft Orientation Day Season 2' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Microsoft Orientation Day Season 2' });
  expect(within(dialog).getByText(/11-station gamified scorecard/)).toBeInTheDocument();
  expect(within(dialog).getByText('1 Dec 2025')).toBeInTheDocument();
  expect(within(dialog).getByRole('link', { name: 'Open event page' })).toHaveAttribute('href', '/events/orientation-season-2');
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe('');
  expect(trigger).toHaveFocus();
});

test('API event details include the supplied date and allow closing with the close button', async () => {
  render(<Events source="api" />);
  fireEvent.click(await screen.findByRole('button', { name: 'View details: Cloud workshop' }));
  const dialog = screen.getByRole('dialog', { name: 'Cloud workshop' });
  expect(within(dialog).getByText('20 Oct 2026')).toBeInTheDocument();
  expect(within(dialog).getByText('Build a web application')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close event details' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('event dates reject invalid inputs and preserve date-only calendar days', () => {
  expect(formatEventDate('not-a-date')).toBe('Date not published');
  expect(formatEventDate(null)).toBe('Date not published');
  expect(formatEventDate('2026-10-20')).toBe('20 Oct 2026');
  expect(formatEventDate('2026-01-20T10:30:00Z', true)).toMatch(/20 Jan 2026.*12:30/);
  expect(formatEventDate('2026-10')).toBe('October 2026');
  expect(formatEventSchedule(eventsData[1])).toBe('July 2026 - August 2026');
});

test('event gallery supports selection and next/previous wrapping', () => {
  render(<EventGallery event={{ ...eventsData[0], gallery: ['/first.jpg', '/second.jpg'] }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
  expect(screen.getByRole('img', { name: /photo 2/ })).toHaveAttribute('src', '/second.jpg');
  fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
  expect(screen.getByRole('img', { name: /photo 1/ })).toHaveAttribute('src', '/first.jpg');
  fireEvent.click(screen.getByRole('button', { name: 'Show photo 2' }));
  expect(screen.getByRole('button', { name: 'Show photo 2' })).toHaveAttribute('aria-pressed', 'true');
});

test.each(['orientation-season-2', 'canal-startup-sprint', 'orientation-season-3', 'missing-event'])('deep link resolves %s without previous navigation', id => {
  testingRender(<MemoryRouter initialEntries={[`/events/${id}`]}><Routes><Route path="/events/:id" element={<EventPage />} /></Routes></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(eventsData.find(event => event.id === id)?.title ?? 'Event not found');
});

test('month-only and date-only schedules do not invent a countdown instant', () => {
  expect(countdownTarget('2026-10')).toBeNull();
  expect(countdownTarget('2026-10-20')).toBeNull();
  expect(countdownTarget('2026-10-20T10:00:00')).toBeNull();
  render(<UpcomingEvent event={{ ...eventsData[2], startsAt: '2026-10', endsAt: null }} />);
  expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  expect(screen.getByText('Exact day and time to be announced')).toBeInTheDocument();
});

test('precise countdown ticks, stops at zero and cleans up', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-20T06:59:58Z'));
  try {
    const { unmount } = render(<UpcomingEvent event={{ ...eventsData[2], startsAt: '2026-10-20T10:00:00+03:00' }} />);
    expect(within(screen.getByRole('timer')).getByText('02')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1000));
    expect(within(screen.getByRole('timer')).getByText('01')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText('Scheduled start reached')).toBeInTheDocument();
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  } finally { jest.useRealTimers(); }
});

test('event archive combines year and category filters and resets pagination', async () => {
  eventsApi.getAll.mockResolvedValue(Array.from({ length: 8 }, (_, index) => ({
    id: index + 1, title: `Workshop ${index + 1}`, description: 'Community learning',
    eventDate: index < 6 ? '2025-12' : '2026-10-20', isUpcoming: index >= 6, isFeatured: index === 7,
  })));
  render(<Events source="api" />);
  await screen.findByRole('heading', { name: 'Workshop 1' });
  expect(screen.queryByRole('heading', { name: 'Workshop 7' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByRole('heading', { name: 'Workshop 7' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  fireEvent.change(screen.getByRole('combobox', { name: 'Event year' }), { target: { value: '2025' } });
  expect(screen.getByRole('heading', { name: 'Workshop 1' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Event pages' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Event category' }), { target: { value: 'Featured' } });
  expect(screen.getByText('Showing 0 of 8 events')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Event year' }), { target: { value: '2026' } });
  expect(screen.getByRole('heading', { name: 'Workshop 8' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  expect(screen.getByText('Showing 8 of 8 events')).toBeInTheDocument();
});

test('archive exposes undated events without inventing a year and searches locations', async () => {
  eventsApi.getAll.mockResolvedValue([{ ...events[0], eventDate: null, location: 'Creativa Ismailia' }, events[1]]);
  render(<Events source="api" />);
  await screen.findByRole('heading', { name: 'Cloud workshop' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Event year' }), { target: { value: 'undated' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Search events' }), { target: { value: '  CREATIVA  ' } });
  expect(await screen.findByText('Showing 1 of 2 events')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Cloud workshop' })).toBeInTheDocument();
});

test('photo gallery uses real albums, searches them and restores focus after viewing photos', () => {
  render(<GalleryPage />);
  const trigger = screen.getByRole('button', { name: 'Open album: Microsoft Orientation Day Season 2' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Microsoft Orientation Day Season 2' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Next photo' }));
  expect(within(dialog).getByRole('img', { name: /photo 2/ })).toHaveAttribute('src', eventsData[0].gallery[1]);
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(trigger).toHaveFocus();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search albums' }), { target: { value: '  SEASON 2  ' } });
  expect(screen.getAllByRole('button', { name: /Open album:/ })).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Microsoft Orientation Day Season 2' })).toHaveAttribute('href', '/events/orientation-season-2');
  fireEvent.change(screen.getByRole('textbox', { name: 'Search albums' }), { target: { value: 'no-matching-album' } });
  expect(screen.getByText('No albums match your search.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByRole('button', { name: 'Open album: Microsoft Orientation Day Season 2' })).toBeInTheDocument();
});

test('photo gallery paginates albums and resets its page when searching', async () => {
  eventsApi.getAll.mockResolvedValue(Array.from({ length: 8 }, (_, index) => ({ ...events[0], id: index, title: `Album ${index}`, imageUrl: `/photo-${index}.jpg` })));
  render(<GalleryPage source="api" />);
  await screen.findByRole('button', { name: 'Open album: Album 0' });
  expect(screen.getAllByRole('button', { name: /Open album:/ })).toHaveLength(6);
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getAllByRole('button', { name: /Open album:/ })).toHaveLength(2);
  fireEvent.change(screen.getByRole('textbox', { name: 'Search albums' }), { target: { value: 'Album 0' } });
  expect(await screen.findByRole('button', { name: 'Open album: Album 0' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Album pages' })).not.toBeInTheDocument();
});

test('photo gallery distinguishes missing photos from a failed request and retries', async () => {
  eventsApi.getAll.mockRejectedValueOnce(new Error('offline'));
  render(<GalleryPage source="api" />);
  expect(screen.getByText('Loading albums...')).toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load events.');
  expect(screen.queryByText('No photo albums published yet.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No photo albums published yet.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Open album:/ })).not.toBeInTheDocument();
});