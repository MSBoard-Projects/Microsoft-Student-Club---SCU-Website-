import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Leaderboard, { GoldenMembersSection } from './Leaderboard';
import RatingManagement from './RatingManagement';
import Sponsors, { EventSponsors } from './Sponsors';
import GoldenMembers, { RecurringGoldenSection, goldenRecipients, recurringRecipients } from './GoldenMembers';
import { parseSponsors } from '../content/sponsors';
import { goldenMembers, parseRatings, rankMembers } from '../content/ratings';
import { useShowcase } from '../context/ShowcaseContext';
import { leaderboardApi, membersApi, sponsorsApi } from '../services/api';

jest.mock('../context/ShowcaseContext', () => ({ useShowcase: jest.fn() }));
jest.mock('../services/api', () => ({
  leaderboardApi: { getAll: jest.fn(), template: jest.fn(), preview: jest.fn(), publish: jest.fn() },
  membersApi: { getAll: jest.fn() },
  sponsorsApi: { getPublished: jest.fn() },
}));

const people = [
  { id: 'first-person', fullName: 'First Person', positionTitle: 'Developer', group: 'member', imageUrl: '/club-media/members/ali-arabi-ali.jpg', certificateUrl: null },
  { id: 'second-person', fullName: 'Second Person', positionTitle: 'Designer', group: 'member', imageUrl: null, certificateUrl: null },
  { id: 'board-person', fullName: 'Board Person', positionTitle: 'Head', group: 'board', imageUrl: null, certificateUrl: null },
];
const rating = (memberId, rate) => ({ memberId, rate, onlineAttendance: null, offlineAttendance: 70, tasks: null, projects: null });
const period = { id: 1, title: 'Week one', startDate: '2026-09-01', endDate: '2026-09-07', publishedAt: '2026-09-08T10:00:00Z', version: 'version-one', entries: [rating('first-person', 95), rating('second-person', 95), rating('board-person', 80)] };
const renderPage = component => render(<MemoryRouter>{component}</MemoryRouter>);

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

beforeEach(() => {
  useShowcase.mockReturnValue({ source: 'api', data: { members: people, events: [] } });
  leaderboardApi.getAll.mockResolvedValue([]);
  sponsorsApi.getPublished.mockResolvedValue([]);
  membersApi.getAll.mockResolvedValue(people.map((person, index) => ({ ...person, id: index + 1, publicId: person.id })));
});

test('rankings share tied places, respect group filters and never invent scores', () => {
  expect(rankMembers(period, people).map(entry => entry.rank)).toEqual([1, 1, 3]);
  expect(rankMembers(period, people, 'board').map(entry => entry.rank)).toEqual([1]);
  expect(rankMembers(undefined, people)).toEqual([]);
  expect(rankMembers({ ...period, entries: [...period.entries, rating('unknown-person', 100)] }, people)).toHaveLength(3);
  expect(() => parseRatings([{ ...period, entries: [rating('first-person', -1)] }])).toThrow();
  expect(() => parseRatings([{ ...period, entries: [rating('first-person', 80), rating('first-person', 90)] }])).toThrow();
});

test('leaderboard search preserves rank, switches periods and links to member profiles', async () => {
  leaderboardApi.getAll.mockResolvedValue([period, { ...period, id: 2, title: 'Earlier week', startDate: '2026-08-01', endDate: '2026-08-07', entries: [rating('board-person', 60)] }]);
  renderPage(<Leaderboard />);
  expect(await screen.findByRole('link', { name: 'Rank 3: Board Person, 80 out of 100' })).toHaveAttribute('href', '/members/board-person');
  fireEvent.change(screen.getByRole('textbox', { name: 'Search leaderboard' }), { target: { value: 'Board Person' } });
  expect(screen.getByRole('link', { name: 'Rank 3: Board Person, 80 out of 100' })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Rating period' }), { target: { value: '2' } });
  expect(screen.getByRole('link', { name: 'Rank 1: Board Person, 60 out of 100' })).toBeInTheDocument();
});

test('local preview does not fabricate leaderboard rows or call live APIs', () => {
  useShowcase.mockReturnValue({ source: 'local', data: { members: people } });
  renderPage(<Leaderboard />);
  expect(screen.getByText('No ratings have been published yet.')).toBeInTheDocument();
  expect(leaderboardApi.getAll).not.toHaveBeenCalled();
});

test('a failed leaderboard request offers retry rather than a fake empty leaderboard', async () => {
  leaderboardApi.getAll.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([period]);
  renderPage(<Leaderboard />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Published data could not be loaded.');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('link', { name: 'Rank 3: Board Person, 80 out of 100' })).toBeInTheDocument();
});

async function prepareUpload() {
  renderPage(<RatingManagement />);
  await screen.findByText('No rating periods published yet.');
  fireEvent.change(screen.getByLabelText(/Period title/), { target: { value: 'Week one' } });
  fireEvent.change(screen.getByLabelText(/Period start/), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText(/Period end/), { target: { value: '2026-09-07' } });
  fireEvent.change(screen.getByLabelText('Ratings workbook (.xlsx)'), { target: { files: [new File(['test'], 'ratings.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Preview workbook' }));
  await screen.findByRole('heading', { name: 'Import preview' });
}

test('invalid spreadsheet rows block publication without modifying any records', async () => {
  leaderboardApi.preview.mockResolvedValue({ rows: [rating('unknown-member', 95)], errors: ['Row 2: unknown MemberId.'], ignoredRows: 0, existingPeriod: null });
  await prepareUpload();
  expect(screen.getByRole('alert')).toHaveTextContent('Row 2: unknown MemberId.');
  expect(screen.getByRole('button', { name: 'Review publication' })).toBeDisabled();
  expect(leaderboardApi.publish).not.toHaveBeenCalled();
});

test('publishing uses the previewed scores and explicit existing-period version', async () => {
  leaderboardApi.preview.mockResolvedValue({ rows: [rating('first-person', 95)], errors: [], ignoredRows: 1, existingPeriod: { id: 1, title: 'Week one', version: 'original-version' } });
  leaderboardApi.publish.mockResolvedValue({ entriesPublished: 1 });
  await prepareUpload();
  expect(leaderboardApi.publish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Review publication' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('All ratings in this existing period will be replaced');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm publication' }));
  await screen.findByText('1 ratings published.');
  expect(leaderboardApi.publish).toHaveBeenCalledWith(expect.objectContaining({ replacePeriodId: 1, expectedVersion: 'original-version', entries: [rating('first-person', 95)] }));
});

test('changing the period invalidates a successful upload preview', async () => {
  leaderboardApi.preview.mockResolvedValue({ rows: [rating('first-person', 95)], errors: [], ignoredRows: 0, existingPeriod: null });
  await prepareUpload();
  fireEvent.change(screen.getByLabelText(/Period end/), { target: { value: '2026-09-08' } });
  expect(screen.queryByRole('heading', { name: 'Import preview' })).not.toBeInTheDocument();
  expect(leaderboardApi.publish).not.toHaveBeenCalled();
});

test('a conflicting replacement requires a fresh preview', async () => {
  leaderboardApi.preview.mockResolvedValue({ rows: [rating('first-person', 95)], errors: [], ignoredRows: 0, existingPeriod: { id: 1, version: 'stale' } });
  leaderboardApi.publish.mockRejectedValue({ response: { status: 409, data: { message: 'Preview again before publishing.' } } });
  await prepareUpload();
  fireEvent.click(screen.getByRole('button', { name: 'Review publication' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm publication' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('alert')).toHaveTextContent('Preview again before publishing.');
  expect(screen.queryByRole('heading', { name: 'Import preview' })).not.toBeInTheDocument();
});

const sponsor = (id, tier, eventKey = null) => ({ id, name: `Partner ${id}`, tier, logoUrl: '/club-media/partner logo.png', websiteUrl: 'https://example.com', description: 'A published partnership', eventKey, eventTitle: eventKey ? 'Test event' : null, displayOrder: 0, isPublished: true });

test('sponsors are grouped by tier, filtered and linked to their events', async () => {
  useShowcase.mockReturnValue({ source: 'api', data: { members: people, events: [{ id: 'test-event', title: 'Test event' }] } });
  sponsorsApi.getPublished.mockResolvedValue([sponsor(1, 'diamond'), sponsor(2, 'gold', 'test-event'), sponsor(3, 'community')]);
  renderPage(<Sponsors />);
  expect(await screen.findByRole('region', { name: 'Diamond' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Gold' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Community partners' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Test event' })).toHaveAttribute('href', '/events/test-event');
  fireEvent.change(screen.getByRole('combobox', { name: 'Sponsor tier' }), { target: { value: 'gold' } });
  expect(screen.queryByRole('region', { name: 'Diamond' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(1);
  fireEvent.change(screen.getByRole('combobox', { name: 'Sponsor event' }), { target: { value: 'club' } });
  expect(screen.getByText('No sponsors match these filters.')).toBeInTheDocument();
});

test('an event never claims sponsorship from an unrelated event or a general club partner', async () => {
  sponsorsApi.getPublished.mockResolvedValue([sponsor(1, 'gold', 'first-event'), sponsor(2, 'community'), sponsor(3, 'silver', 'other-event')]);
  renderPage(<EventSponsors eventId="first-event" />);
  expect(await screen.findByRole('heading', { name: 'Partner 1' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Partner 2' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Partner 3' })).not.toBeInTheDocument();
  expect(() => parseSponsors([{ ...sponsor(1, 'gold'), websiteUrl: 'javascript:alert(1)' }])).toThrow();
  expect(() => parseSponsors([{ ...sponsor(1, 'gold'), isPublished: false }])).toThrow();
});

test('local sponsor page displays the user-supplied logos without invented tiers or descriptions', () => {
  useShowcase.mockReturnValue({ source: 'local', data: { events: [] } });
  renderPage(<Sponsors />);
  expect(screen.getAllByRole('img')).toHaveLength(22);
  expect(screen.getByRole('img', { name: 'Microsoft logo' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'GitHub logo' })).toBeInTheDocument();
  expect(sponsorsApi.getPublished).not.toHaveBeenCalled();
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

test('golden members uses the latest completed calendar month, member-only ranks and third-place ties', () => {
  const roster = [...people, ...['third', 'fourth', 'fifth'].map(id => ({ ...people[0], id, fullName: id }))];
  const august = { ...period, title: 'August ratings', startDate: '2026-08-01', endDate: '2026-08-31', entries: [rating('board-person', 100), rating('unknown', 100), rating('first-person', 99), rating('second-person', 95), rating('third', 90), rating('fourth', 90), rating('fifth', 80)] };
  const earlier = { ...august, id: 2, startDate: '2026-07-01', endDate: '2026-07-31' };
  const future = { ...august, id: 3, startDate: '2026-09-01', endDate: '2026-09-30' };
  const result = goldenMembers([earlier, period, future, august], roster, new Date('2026-09-13T12:00:00Z'));
  expect(result.period).toBe(august);
  expect(result.entries.map(entry => entry.rank)).toEqual([1, 2, 3, 3]);
  expect(result.entries.map(entry => entry.memberId)).not.toContain('board-person');
  expect(goldenMembers([period], roster).period).toBeUndefined();
  expect(goldenMembers([{ ...august, publishedAt: '2027-01-01T00:00:00Z' }], roster, new Date('2026-09-13')).period).toBeUndefined();
  expect(goldenMembers([{ ...august, entries: [] }, earlier], roster, new Date('2026-09-13')).entries).toEqual([]);
});

test('golden member cards identify the published month and link to profiles and its leaderboard', async () => {
  const monthly = { ...period, title: 'Monthly recognition', startDate: '2025-08-01', endDate: '2025-08-31', publishedAt: '2025-09-01T10:00:00Z' };
  leaderboardApi.getAll.mockResolvedValue([monthly]);
  renderPage(<GoldenMembersSection />);
  expect(await screen.findByRole('link', { name: 'First Person' })).toHaveAttribute('href', '/members/first-person');
  expect(screen.getByText(/August 2025.*Monthly recognition/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Full leaderboard' })).toHaveAttribute('href', '/leaderboard?period=1');
  expect(screen.queryByRole('link', { name: 'Board Person' })).not.toBeInTheDocument();
});

test('golden members distinguishes loading, errors and unpublished awards without fake winners', async () => {
  leaderboardApi.getAll.mockRejectedValueOnce(new Error('offline'));
  renderPage(<GoldenMembersSection />);
  expect(screen.getByText('Loading monthly recognition...')).toBeInTheDocument();
  expect(await screen.findByRole('alert')).toHaveTextContent('Published data could not be loaded.');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Golden Members will be announced after a monthly rating is published.')).toBeInTheDocument();
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

test('workbook recognition keeps all awards and the nine recurring people in their own categories', () => {
  expect(goldenRecipients).toHaveLength(36);
  expect(goldenRecipients.reduce((total, person) => total + person.awards.length, 0)).toBe(45);
  expect(recurringRecipients).toHaveLength(9);
  renderPage(<RecurringGoldenSection />);
  expect(within(screen.getByRole('region', { name: 'Golden Heads' })).getAllByRole('article')).toHaveLength(3);
  expect(within(screen.getByRole('region', { name: 'Golden Instructors' })).getAllByRole('article')).toHaveLength(1);
  expect(within(screen.getByRole('region', { name: 'Golden Members' })).getAllByRole('article')).toHaveLength(5);
  expect(screen.getByRole('link', { name: 'All golden honourees' })).toHaveAttribute('href', '/golden-members');
});

test('golden directory combines category, month, recurring and name filters without guessing profiles', () => {
  renderPage(<GoldenMembers />);
  expect(screen.getAllByRole('article')).toHaveLength(36);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Recognised in both months' }));
  expect(screen.getAllByRole('article')).toHaveLength(9);
  fireEvent.click(screen.getByRole('button', { name: 'Golden Heads' }));
  expect(screen.getAllByRole('article')).toHaveLength(3);
  fireEvent.change(screen.getByRole('combobox', { name: 'Recognition month' }), { target: { value: '2026-02' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Search golden honourees' }), { target: { value: '  ZAHRAA  ' } });
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.queryByRole('link', { name: 'Zahraa Khaled' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search golden honourees' }), { target: { value: 'not-a-name' } });
  expect(screen.getByText('No honourees match these filters.')).toBeInTheDocument();
});