import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import EventManagement from './EventManagement';
import { eventsApi } from '../services/api';

jest.mock('../services/api', () => ({ eventsApi: { getAll: jest.fn() } }));
jest.mock('../components/ImageUpload', () => () => <div>Image upload</div>);

const events = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1, title: `Event ${index + 1}`, eventDate: '2026-10-01',
  description: index === 6 ? 'Cloud workshop' : null, location: index === 6 ? 'Lab A' : null,
  isUpcoming: index === 6, isFeatured: index === 0
}));

beforeEach(() => {
  eventsApi.getAll.mockResolvedValue(events);
});

test('paginates and combines event search with upcoming and featured filters', async () => {
  render(<EventManagement />);
  expect(await screen.findByText('1-6 of 7 events')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByText('7-7 of 7 events')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' CLOUD ' } });
  expect(screen.getByText('1-1 of 1 events')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'upcoming' } });
  expect(screen.getByText('Event 7')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'featured' } });
  expect(screen.getByText('No matching events')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByText('Event 1')).toBeInTheDocument();
  expect(screen.queryByText('Event 7')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lab a' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } });
  expect(screen.getByText('Event 7')).toBeInTheDocument();
});

test('distinguishes failed requests from an empty collection and supports retry', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  eventsApi.getAll.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  render(<EventManagement />);
  expect(await screen.findByText('Failed to load events. Please try again.')).toBeInTheDocument();
  expect(screen.queryByText('No events yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh events' }));
  expect(await screen.findByText('No events yet')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'events pagination' })).not.toBeInTheDocument();
  consoleError.mockRestore();
});

test('refresh resets pagination and keeps the active filter', async () => {
  render(<EventManagement />);
  await screen.findByText('Event 1');
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  eventsApi.getAll.mockResolvedValueOnce(events.slice(0, 1));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh events' }));
  expect(await screen.findByText('1-1 of 1 events')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'upcoming' } });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh events' }));
  expect(await screen.findByText('Event 7')).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toHaveValue('upcoming');
});

test('keeps previously loaded events browsable when refresh fails', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<EventManagement />);
  await screen.findByText('Event 1');
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  eventsApi.getAll.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh events' }));
  await screen.findByText('Failed to load events. Please try again.');
  expect(screen.getByText('Event 7')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
  expect(screen.getByText('Event 1')).toBeInTheDocument();
  consoleError.mockRestore();
});