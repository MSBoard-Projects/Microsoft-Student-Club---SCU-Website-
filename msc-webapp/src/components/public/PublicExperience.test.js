import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import GlassImage from './GlassImage';
import OptimizedImage from './OptimizedImage';
import HeroSection from './HeroSection';
import StatisticsBanner, { Counter } from './StatisticsBanner';
import PublicHeader from './PublicHeader';
import { PublicThemeProvider } from './ThemeProvider';
import { clubContent } from '../../content/club';

jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    animate: jest.fn(),
    useInView: jest.fn(),
    useReducedMotion: jest.fn(),
    useScroll: () => ({ scrollYProgress: actual.motionValue(0) }),
  };
});

beforeEach(() => {
  localStorage.clear();
  useReducedMotion.mockReturnValue(false);
  useInView.mockReturnValue(true);
  animate.mockImplementation(() => ({ stop: jest.fn() }));
});

test('counter starts at zero, counts to its value and cleans up on value changes', () => {
  const { rerender, unmount } = render(<Counter value={2450} />);
  expect(screen.getByText('0')).toBeInTheDocument();
  expect(screen.getByLabelText('2,450')).toBeInTheDocument();
  const firstAnimation = animate.mock.results[0].value;
  act(() => animate.mock.calls[0][2].onUpdate(2450));
  expect(screen.getByText('2,450')).toBeInTheDocument();
  rerender(<Counter value={3000} />);
  expect(firstAnimation.stop).toHaveBeenCalled();
  expect(screen.getByText('0')).toBeInTheDocument();
  const secondAnimation = animate.mock.results[1].value;
  unmount();
  expect(secondAnimation.stop).toHaveBeenCalled();
});

test('counter waits until in view and renders immediately with reduced motion', () => {
  useInView.mockReturnValue(false);
  const { rerender } = render(<Counter value={24000} />);
  expect(animate).not.toHaveBeenCalled();
  useReducedMotion.mockReturnValue(true);
  rerender(<Counter value={24000} />);
  expect(screen.getByText('24K')).toBeInTheDocument();
  expect(screen.getByLabelText('24,000')).toBeInTheDocument();
  expect(animate).not.toHaveBeenCalled();
});

test.each([null, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('counter does not invent a number for %s', value => {
  render(<Counter value={value} />);
  expect(screen.getByLabelText('Not published')).toHaveTextContent('--');
  expect(animate).not.toHaveBeenCalled();
});

test('statistics expose all four metrics and distinguish zero from unpublished values', () => {
  useReducedMotion.mockReturnValue(true);
  render(<StatisticsBanner statistics={{ registeredAttendees: 0, eventLocations: 8, beneficiaries: null, eventsConducted: -1 }} />);
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
  expect(screen.getByText('Total Registered Attendees')).toBeInTheDocument();
  expect(screen.getByLabelText('0')).toBeInTheDocument();
  expect(screen.getAllByText('Not published yet')).toHaveLength(2);
});

test('image fallback retains its accessible name and recovers when the URL is replaced', () => {
  const { rerender } = render(<GlassImage src="/missing.jpg" alt="Club gathering" aspectRatio="4 / 3" />);
  fireEvent.error(screen.getByRole('img', { name: 'Club gathering' }));
  expect(screen.getByText('Image coming soon')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Club gathering' })).toBeInTheDocument();
  rerender(<GlassImage src="/replacement.jpg" alt="Club gathering" srcSet="/small.jpg 480w, /replacement.jpg 1200w" sizes="100vw" softEdges />);
  expect(screen.getByRole('img', { name: 'Club gathering' })).toHaveAttribute('src', '/replacement.jpg');
  expect(screen.getByRole('img', { name: 'Club gathering' })).toHaveAttribute('sizes', '100vw');
  expect(screen.queryByText('Image coming soon')).not.toBeInTheDocument();
});

test('optimized images clear their skeleton on load or failure and reset for a new source', () => {
  const { rerender } = render(<OptimizedImage src="/first.jpg" alt="Community" aspectRatio="4 / 3" />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading Community');
  expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
  fireEvent.load(screen.getByRole('img'));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  rerender(<OptimizedImage src="/second.jpg" alt="Community" priority />);
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.getByRole('img')).toHaveAttribute('loading', 'eager');
  fireEvent.error(screen.getByRole('img'));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByText('Image coming soon')).toBeInTheDocument();
});

test('hero highlights can switch photographs and still work without supplied assets', () => {
  useReducedMotion.mockReturnValue(true);
  const { rerender } = render(<MemoryRouter><HeroSection assets={clubContent.assets} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Show Orientation' }));
  expect(screen.getByRole('button', { name: 'Show Orientation' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('img', { name: 'Students gathering at the club orientation' })).toHaveAttribute('src', '/club-media/hero-orientation.jpg');
  rerender(<MemoryRouter><HeroSection assets={{ logo: null, hero: null, heroAlt: 'Club community', community: null }} /></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Microsoft');
  expect(screen.getByRole('img', { name: 'Club community' })).toBeInTheDocument();
  expect(screen.queryByRole('group', { name: 'Community highlights' })).not.toBeInTheDocument();
});

test('theme controls persist a choice and restore it on the next mount', () => {
  const view = () => <MemoryRouter><PublicThemeProvider><PublicHeader /></PublicThemeProvider></MemoryRouter>;
  const { unmount } = render(view());
  const controls = screen.getByRole('group', { name: 'Color theme' });
  fireEvent.click(within(controls).getByRole('button', { name: 'Day theme' }));
  expect(localStorage.getItem('club-theme')).toBe('day');
  unmount();
  render(view());
  expect(screen.getByRole('button', { name: 'Day theme' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Forest theme' }));
  expect(localStorage.getItem('club-theme')).toBe('forest');
});