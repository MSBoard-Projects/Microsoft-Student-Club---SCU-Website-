import React from 'react';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import ContentManagement, { initialImport } from './ContentManagement';
import { eventsApi, membersApi, achievementsApi, showcaseApi, sponsorsApi } from '../services/api';

jest.mock('../services/api', () => ({ eventsApi: { getAll: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn() }, membersApi: { getAll: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn() }, achievementsApi: { getAll: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn() }, sponsorsApi: { getAll: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() }, showcaseApi: { getMemberTypes: jest.fn(), getStatistics: jest.fn(), saveStatistics: jest.fn(), importContent: jest.fn() } }));
let mockSuperAdmin = false;
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ isSuperAdmin: () => mockSuperAdmin }) }));
const types = [{ id: 1, typeName: 'High Board' }, { id: 2, typeName: 'Board' }, { id: 4, typeName: 'Member' }, { id: 5, typeName: 'Instructor' }];
beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }; HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); }; });
beforeEach(() => {
  mockSuperAdmin = false;
  showcaseApi.getMemberTypes.mockResolvedValue(types);
  eventsApi.getAll.mockResolvedValue([{ id: 12, title: 'Orientation', description: 'Eleven stations', startsAt: '2026-10-19T15:00:00+03:00', endsAt: '2026-10-19T19:00:00+03:00', gallery: ['/one.jpg'], isUpcoming: true }]);
  membersApi.getAll.mockResolvedValue([{ id: 4, fullName: 'Student', positionTitle: 'Member', memberTypeId: 4, publicId: 'student', displayOrder: 0 }]);
  achievementsApi.getAll.mockResolvedValue([]);
  sponsorsApi.getAll.mockResolvedValue([]);
  showcaseApi.getStatistics.mockResolvedValue({ registeredAttendees: 8000, beneficiaries: 8000, eventLocations: null, eventsConducted: 2 });
});

test('editing an event preserves schedule precision and gallery, and retains the form on save failure', async () => {
  eventsApi.update.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
  render(<ContentManagement kind="events" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Orientation' }));
  const dialog = screen.getByRole('dialog', { name: 'Edit Event' });
  expect(within(dialog).getByLabelText('Start (date, month or ISO timestamp)')).toHaveValue('2026-10-19T15:00:00+03:00');
  fireEvent.change(within(dialog).getByLabelText('Gallery URLs (one per line)'), { target: { value: '/one.jpg\n/two.jpg' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('The request failed');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(eventsApi.update).toHaveBeenLastCalledWith(12, expect.objectContaining({ startsAt: '2026-10-19T15:00:00+03:00', endsAt: '2026-10-19T19:00:00+03:00', gallery: ['/one.jpg', '/two.jpg'] }));
});

test('legacy event dates remain editable without inventing a timezone', async () => {
  eventsApi.getAll.mockResolvedValue([{ id: 9, title: 'Legacy event', description: 'Details', eventDate: '2025-12-01T00:00:00', gallery: [] }]);
  render(<ContentManagement kind="events" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Legacy event' }));
  expect(screen.queryByText('undefined / Draft')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Start (date, month or ISO timestamp)')).toHaveValue('2025-12-01');
});

test('members retain their stable ID and certificate when updated', async () => {
  render(<ContentManagement kind="members" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Student' }));
  fireEvent.change(screen.getByLabelText('Certificate PDF URL'), { target: { value: '/club-certificates/student.pdf' } });
  fireEvent.change(screen.getByLabelText('Biography'), { target: { value: 'Member-supplied biography' } });
  fireEvent.change(screen.getByLabelText('GitHub URL (HTTPS)'), { target: { value: 'https://github.com/test' } });
  fireEvent.change(screen.getByLabelText('Public email'), { target: { value: 'public@example.com' } });
  fireEvent.change(screen.getByLabelText('Public phone (+country code)'), { target: { value: '+201012345678' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(membersApi.update).toHaveBeenCalledWith(4, expect.objectContaining({ publicId: 'student', memberTypeId: 4, certificateUrl: '/club-certificates/student.pdf', bio: 'Member-supplied biography', githubUrl: 'https://github.com/test', publicEmail: 'public@example.com', publicPhone: '+201012345678', facebookUrl: null })));
});

test('sponsors use tier and event selectors and explicit publication status', async () => {
  sponsorsApi.create.mockResolvedValue({ id: 1 });
  render(<ContentManagement kind="sponsors" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add Sponsor' }));
  expect(screen.getByLabelText('Published')).not.toBeChecked();
  fireEvent.change(screen.getByLabelText(/Sponsor name/), { target: { value: 'Real partner' } });
  fireEvent.change(screen.getByLabelText(/Sponsor tier/), { target: { value: 'gold' } });
  fireEvent.change(screen.getByLabelText('Associated event'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Logo URL'), { target: { value: '/club-media/partner.png' } });
  fireEvent.click(screen.getByLabelText('Published'));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(sponsorsApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Real partner', tier: 'gold', eventId: 12, logoUrl: '/club-media/partner.png', isPublished: true })));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('statistics preserve unknown versus zero values', async () => {
  render(<ContentManagement kind="statistics" />);
  const locations = await screen.findByLabelText('Event locations');
  expect(locations).toHaveAttribute('min', '0');
  fireEvent.change(locations, { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save statistics' }));
  await waitFor(() => expect(showcaseApi.saveStatistics).toHaveBeenCalledWith({ registeredAttendees: 8000, beneficiaries: 8000, eventLocations: 0, eventsConducted: 2 }));
});

test('achievement creation submits actual names and evidence', async () => {
  render(<ContentManagement kind="achievements" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add Achievement' }));
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Award' } });
  fireEvent.change(screen.getByLabelText(/Student names/), { target: { value: 'Student One\nStudent Two' } });
  fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Verified award' } });
  fireEvent.change(screen.getByLabelText('Evidence URL (HTTPS)'), { target: { value: 'https://example.com/award' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(achievementsApi.create).toHaveBeenCalledWith(expect.objectContaining({ studentNames: ['Student One', 'Student Two'], evidenceUrl: 'https://example.com/award' })));
});

test('initial import uses confirmed data and is exposed only to SuperAdmin', async () => {
  const payload = initialImport(types);
  expect(payload.members).toHaveLength(102);
  expect(payload.events[0].startsAt).toBe('2025-12-01');
  expect(payload.events[0].gallery).toHaveLength(14);
  expect(payload.statistics.registeredAttendees).toBe(8000);
  const { rerender } = render(<ContentManagement kind="events" />);
  await screen.findByRole('button', { name: 'Edit Orientation' });
  expect(screen.queryByRole('button', { name: 'Import initial catalogue' })).not.toBeInTheDocument();
  mockSuperAdmin = true;
  rerender(<ContentManagement kind="events" />);
  showcaseApi.importContent.mockResolvedValue({ eventsAdded: 3, membersAdded: 102 });
  fireEvent.click(screen.getByRole('button', { name: 'Import initial catalogue' }));
  expect(showcaseApi.importContent).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm import' }));
  expect(await screen.findByText('Imported 3 events and 102 members.')).toBeInTheDocument();
});

test('administration pagination advances and filtering resets the page', async () => {
  eventsApi.getAll.mockResolvedValue(Array.from({ length: 7 }, (_, index) => ({ id: index + 1, title: `Event ${index + 1}`, description: 'Details' })));
  render(<ContentManagement kind="events" />);
  await screen.findByRole('button', { name: 'Edit Event 1' });
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByRole('button', { name: 'Edit Event 7' })).toBeInTheDocument();
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search events' }), { target: { value: 'Event 1' } });
  expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
});