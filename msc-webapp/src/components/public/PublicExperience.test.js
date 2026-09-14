import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import GlassImage from './GlassImage';
import OptimizedImage from './OptimizedImage';
import HeroSection from './HeroSection';
import StatisticsBanner, { Counter } from './StatisticsBanner';
import PublicHeader from './PublicHeader';
import CommunityMoments from './CommunityMoments';
import { SupporterWall } from './Supporters';
import supporterLogos from '../../content/supporterLogos.json';
import { PublicThemeProvider } from './ThemeProvider';
import { clubContent } from '../../content/club';
import { communityAlbums, teamPhoto } from '../../content/communityAlbums';
import { members, memberContactLinks } from '../../content/members';
import { HighBoardSection, MemberSocialLinks } from '../../pages/MemberDirectory';
import ClubLanding from '../../pages/ClubLanding';
import Tracks from '../../pages/Tracks';

jest.mock('../../services/api', () => ({ showcaseApi: { get: jest.fn() }, leaderboardApi: { getAll: jest.fn() } }));

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

test('compact supporters preserve folder grouping, expose logos once, and pause on request or offscreen', () => {
  const { container, rerender } = render(<MemoryRouter><SupporterWall compact /></MemoryRouter>);
  for (const group of ['Logos 1', 'Logos 2']) {
    expect(within(screen.getByRole('region', { name: group })).getAllByRole('img').map(image => image.alt)).toEqual(supporterLogos.filter(logo => logo.group === group).map(logo => `${logo.name} logo`));
  }
  expect(container.querySelectorAll('.club-supporter-reverse')).toHaveLength(1);
  expect(container.querySelector('.club-supporter-grid')).toBeNull();
  expect(container.querySelector('.club-program-band')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Pause logo animation' }));
  expect(screen.getByRole('region', { name: 'Sponsors & supporters' })).toHaveAttribute('data-paused', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Play logo animation' }));
  expect(screen.getByRole('region', { name: 'Sponsors & supporters' })).toHaveAttribute('data-paused', 'false');
  useInView.mockReturnValue(false);
  rerender(<MemoryRouter><SupporterWall compact /></MemoryRouter>);
  expect(screen.getByRole('region', { name: 'Sponsors & supporters' })).toHaveAttribute('data-paused', 'true');
  useReducedMotion.mockReturnValue(true);
  rerender(<MemoryRouter><SupporterWall compact /></MemoryRouter>);
  expect(screen.queryByRole('button', { name: /logo animation/ })).not.toBeInTheDocument();
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
  expect(screen.getByText('Students at our events')).toBeInTheDocument();
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
  expect(screen.getByRole('button', { name: 'Show All Team' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('img', { name: 'The Microsoft Student Club team together at orientation' })).toHaveAttribute('src', teamPhoto);
  expect(within(screen.getByRole('group', { name: 'Community highlights' })).getAllByRole('button')).toHaveLength(5);
  fireEvent.click(screen.getByRole('button', { name: 'Show Orientation' }));
  expect(screen.getByRole('button', { name: 'Show Orientation' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('img', { name: 'Students gathering at the club orientation' })).toHaveAttribute('src', '/club-media/hero-orientation.jpg');
  rerender(<MemoryRouter><HeroSection assets={{ logo: null, hero: null, heroAlt: 'Club community', community: null }} /></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Microsoft');
  expect(screen.getByRole('img', { name: 'Club community' })).toBeInTheDocument();
  expect(screen.queryByRole('group', { name: 'Community highlights' })).not.toBeInTheDocument();
});

test('hero cycles every six seconds and pauses for keyboard focus, hover and explicit pause', () => {
  jest.useFakeTimers();
  try {
    const { unmount } = render(<MemoryRouter><HeroSection assets={clubContent.assets} /></MemoryRouter>);
    act(() => jest.advanceTimersByTime(6000));
    expect(screen.getByRole('button', { name: 'Show Microsoft Egypt' })).toHaveAttribute('aria-pressed', 'true');
    const group = screen.getByRole('group', { name: 'Community highlights' });
    fireEvent.focus(screen.getByRole('button', { name: 'Show Microsoft Egypt' }));
    fireEvent.mouseEnter(group);
    fireEvent.mouseLeave(group);
    act(() => jest.advanceTimersByTime(12000));
    expect(screen.getByRole('button', { name: 'Show Microsoft Egypt' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.blur(group, { relatedTarget: document.body });
    fireEvent.click(screen.getByRole('button', { name: 'Pause photo slideshow' }));
    act(() => jest.advanceTimersByTime(12000));
    expect(screen.getByRole('button', { name: 'Show Microsoft Egypt' })).toHaveAttribute('aria-pressed', 'true');
    unmount();
  } finally { jest.useRealTimers(); }
});

test('tracks expose all twelve disciplines and four group anchors', () => {
  useReducedMotion.mockReturnValue(true);
  const { container } = render(<MemoryRouter><Tracks /></MemoryRouter>);
  expect(container.querySelectorAll('.club-track')).toHaveLength(12);
  expect(screen.getByRole('heading', { name: 'Cyber Security' })).toBeInTheDocument();
  expect(screen.getByText(/graphic design, video editing and marketing/)).toBeInTheDocument();
  expect(within(screen.getByRole('navigation', { name: 'Track groups' })).getAllByRole('link')).toHaveLength(4);
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

test('community moments has opposite rows, copies outside tab order and pause control', () => {
  const onSelect = jest.fn();
  const { container } = render(<MemoryRouter><CommunityMoments events={clubContent.events} onSelect={onSelect} /></MemoryRouter>);
  expect(container.querySelectorAll('.club-moments-track')).toHaveLength(2);
  expect(container.querySelectorAll('.club-moments-reverse')).toHaveLength(1);
  const copies = [...container.querySelectorAll('.club-moments-copy button')];
  expect(copies.every(button => button.tabIndex === -1)).toBe(true);
  fireEvent.click(copies[0]);
  expect(onSelect).toHaveBeenCalledWith(clubContent.events[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Pause photo animation' }));
  expect(screen.getByRole('region', { name: 'Moments we share.' })).toHaveAttribute('data-paused', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Play photo animation' }));
  expect(screen.getByRole('region', { name: 'Moments we share.' })).toHaveAttribute('data-paused', 'false');
  fireEvent.click(screen.getAllByRole('button', { name: /View album:/ })[0]);
  expect(onSelect).toHaveBeenCalledWith(clubContent.events[0]);
  expect(screen.getByRole('link', { name: 'All photos' })).toHaveAttribute('href', '/gallery');
});

test('community moments respects reduced motion and omits an empty photo collection', () => {
  useReducedMotion.mockReturnValue(true);
  const { rerender } = render(<MemoryRouter><CommunityMoments events={clubContent.events} onSelect={jest.fn()} /></MemoryRouter>);
  expect(screen.queryByRole('button', { name: 'Pause photo animation' })).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Moments we share.' })).toHaveAttribute('data-paused', 'true');
  rerender(<MemoryRouter><CommunityMoments events={[]} onSelect={jest.fn()} /></MemoryRouter>);
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
});

test('public contact icons appear only for valid supplied links, without inventing accounts', () => {
  const member = { ...members[0], fullName: 'Test Person', githubUrl: 'https://github.com/test', linkedInUrl: 'https://www.linkedin.com/in/test', facebookUrl: 'https://facebook.com/test', instagramUrl: 'https://instagram.com/test', websiteUrl: 'https://example.com', publicEmail: 'test@example.com', publicPhone: '+201012345678' };
  const { rerender } = render(<MemberSocialLinks member={member} />);
  expect(screen.getAllByRole('link')).toHaveLength(7);
  expect(screen.getByRole('link', { name: 'GitHub: Test Person' })).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.getByRole('link', { name: 'Public email: Test Person' })).toHaveAttribute('href', 'mailto:test@example.com');
  expect(screen.getByRole('link', { name: 'Public phone (+country code): Test Person' })).toHaveAttribute('href', 'tel:+201012345678');
  expect(memberContactLinks({ githubUrl: 'javascript:alert(1)', linkedInUrl: '//example.com', websiteUrl: 'https://user:secret@example.com', publicEmail: 'test@example.com?bcc=other@example.com', publicPhone: '123;456', facebookUrl: '', instagramUrl: 'http://example.com' })).toEqual([]);
  rerender(<MemberSocialLinks member={members[0]} />);
  expect(screen.queryByRole('group')).not.toBeInTheDocument();
});

test('home leadership highlights the existing president without duplicating his profile', () => {
  render(<MemoryRouter><HighBoardSection /></MemoryRouter>);
  expect(screen.getAllByRole('heading', { name: 'Ali Arabi Ali' })).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'View profile: Ali Arabi Ali' })).toHaveAttribute('href', '/members/ali-arabi-ali');
  expect(screen.getByRole('region', { name: 'Meet the High Board' }).querySelector('.club-officer-president')).toHaveTextContent('Ali Arabi Ali');
});

test('community photo rows interleave albums and slow down on hover without pausing', () => {
  const { container } = render(<MemoryRouter><CommunityMoments events={communityAlbums} onSelect={jest.fn()} /></MemoryRouter>);
  const updatePlaybackRate = jest.fn();
  container.querySelectorAll('.club-moments-track').forEach(track => { track.getAnimations = () => [{ updatePlaybackRate }]; });
  fireEvent.mouseEnter(container.querySelector('.club-moments-rows'));
  expect(updatePlaybackRate).toHaveBeenCalledWith(0.35);
  expect(screen.getByRole('region', { name: 'Moments we share.' })).toHaveAttribute('data-paused', 'false');
  fireEvent.mouseLeave(container.querySelector('.club-moments-rows'));
  expect(updatePlaybackRate).toHaveBeenCalledWith(1);
  const labels = screen.getAllByRole('button', { name: /View album:/ }).slice(0, 6).map(button => button.getAttribute('aria-label').split(', photo')[0]);
  expect(new Set(labels).size).toBe(6);
});

test('homepage orders programs, next event, story and event catalogue before recurring honours and compact sponsors', () => {
  useReducedMotion.mockReturnValue(true);
  const { container } = render(<MemoryRouter><ClubLanding /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'About Us' })).toBeInTheDocument();
  expect(screen.getByText('Creating a dynamic student community where Microsoft technologies fuel innovation, leadership, and real-world impact, bridging the gap between academia and industry.')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Mission' })).toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: 'Microsoft logo' })).toHaveLength(1);
  expect(screen.getAllByRole('img', { name: 'GitHub logo' })).toHaveLength(1);
  expect(within(screen.getByRole('region', { name: 'Sponsors & supporters' })).getAllByRole('img')).toHaveLength(16);
  expect(container.querySelector('.club-hero').nextElementSibling).toHaveClass('club-program-band');
  expect(container.querySelector('.club-program-band').nextElementSibling).toHaveClass('club-statistics');
  expect(container.querySelector('.club-statistics').nextElementSibling).toHaveClass('club-upcoming');
  expect(screen.getByLabelText('3,000')).toBeInTheDocument();
  expect(screen.getByLabelText('5,000')).toBeInTheDocument();
  expect(screen.getByLabelText('100+')).toBeInTheDocument();
  expect(container.querySelectorAll('.club-event-card')).toHaveLength(4);
  expect(container.querySelector('.club-upcoming').nextElementSibling).toHaveAttribute('id', 'club-story');
  expect(container.querySelector('#club-story').nextElementSibling).toHaveAttribute('id', 'club-events');
  expect(container.querySelector('.club-supporters').previousElementSibling).toHaveClass('club-golden');
});