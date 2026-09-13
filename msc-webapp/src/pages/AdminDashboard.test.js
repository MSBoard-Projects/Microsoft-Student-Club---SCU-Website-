import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { eventsApi, membersApi } from '../services/api';

jest.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
jest.mock('../services/api', () => ({ membersApi: { getAll: jest.fn() }, eventsApi: { getAll: jest.fn() } }));
jest.mock('../components/PageTransition', () => ({ children }) => <div>{children}</div>);

const events = [{ id: 1, title: 'Cloud workshop', eventDate: '2026-10-20', isUpcoming: true, isFeatured: true }, { id: 2, title: 'Welcome session', eventDate: '2026-08-01', isUpcoming: false, isFeatured: false }];

beforeEach(() => {
  membersApi.getAll.mockResolvedValue([{ id: 1, fullName: 'Test Member', memberTypeId: 1 }]);
  eventsApi.getAll.mockResolvedValue(events);
});

test('shows API statistics and filters events without inventing attendance points', async () => {
  render(<AdminDashboard />);
  expect(await screen.findByText('Cloud workshop')).toBeInTheDocument();
  expect(screen.queryByText('Welcome session')).not.toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Club statistics' })).getByRole('link', { name: /Club members 1/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'All events' }));
  expect(screen.getByText('Welcome session')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search events' }), { target: { value: 'cloud' } });
  await waitFor(() => expect(screen.queryByText('Welcome session')).not.toBeInTheDocument());
  expect(screen.getByText('Not connected yet')).toBeInTheDocument();
});

test('keeps partial data and supports retry when an API fails', async () => {
  eventsApi.getAll.mockRejectedValueOnce(new Error('offline'));
  render(<AdminDashboard />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Events could not be loaded');
  expect(screen.getByRole('link', { name: /Club members 1/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Total events Unavailable/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Cloud workshop')).toBeInTheDocument();
  expect(eventsApi.getAll).toHaveBeenCalledTimes(2);
});

test('distinguishes empty and filtered results', async () => {
  render(<AdminDashboard />);
  await screen.findByText('Cloud workshop');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } });
  expect(await screen.findByText('No matching events')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(await screen.findByText('Cloud workshop')).toBeInTheDocument();
});

test('paginates the schedule', async () => {
  eventsApi.getAll.mockResolvedValue(Array.from({ length: 6 }, (_, index) => ({ ...events[0], id: index, title: `Event ${index}` })));
  render(<AdminDashboard />);
  expect(await screen.findByText('1-5 of 6 events')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByText('6-6 of 6 events')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
});