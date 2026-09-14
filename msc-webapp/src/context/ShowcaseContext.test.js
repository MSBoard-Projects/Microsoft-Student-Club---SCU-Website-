import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShowcaseProvider, PublicContentGate, useShowcase, parseShowcase, localShowcase } from './ShowcaseContext';
import { showcaseApi } from '../services/api';

jest.mock('../services/api', () => ({ showcaseApi: { get: jest.fn() } }));

function Summary() {
  const { data, refresh } = useShowcase();
  return <><p>{data.events.map(event => event.title).join(', ') || 'No published events'}</p><p>Attendees: {data.statistics.registeredAttendees ?? 'Unknown'}</p><button onClick={refresh}>Refresh</button></>;
}

test('API mode uses saved content, refreshes after writes and does not replace an empty catalogue with fixtures', async () => {
  showcaseApi.get.mockResolvedValueOnce({ ...localShowcase, events: [], members: [], achievements: [], statistics: { ...localShowcase.statistics, registeredAttendees: 42 } });
  render(<MemoryRouter><ShowcaseProvider source="api"><PublicContentGate><Summary /></PublicContentGate></ShowcaseProvider></MemoryRouter>);
  expect(await screen.findByText('No published events')).toBeInTheDocument();
  expect(screen.getByText('Attendees: 42')).toBeInTheDocument();
  showcaseApi.get.mockResolvedValueOnce(localShowcase);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(await screen.findByText(/Microsoft Orientation Day Season 2/)).toBeInTheDocument();
  expect(screen.getByText('Attendees: 3000')).toBeInTheDocument();
});

test('API errors are visible and retry recovers without local fallback', async () => {
  showcaseApi.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(localShowcase);
  render(<MemoryRouter><ShowcaseProvider source="api"><PublicContentGate><Summary /></PublicContentGate></ShowcaseProvider></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Content could not be loaded');
  expect(screen.queryByText(/Microsoft Orientation/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Attendees: 3000')).toBeInTheDocument();
});

test('snapshot validation rejects malformed records and statistics', () => {
  expect(() => parseShowcase({ ...localShowcase, members: [{}] })).toThrow();
  expect(() => parseShowcase({ ...localShowcase, statistics: { ...localShowcase.statistics, beneficiaries: -1 } })).toThrow();
  expect(() => parseShowcase({ ...localShowcase, events: [{ ...localShowcase.events[0], registrationUrl: 123 }] })).toThrow();
  expect(parseShowcase(localShowcase).members).toHaveLength(101);
});