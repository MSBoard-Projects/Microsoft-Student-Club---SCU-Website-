import React from 'react';
import { fireEvent, render as renderComponent, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import MembersPage, { LeadershipPage, HighBoardSection, MemberCard, MemberProfile } from './MemberDirectory';
import Achievements from './Achievements';
import { members, highBoard } from '../content/members';

jest.mock('../services/api', () => ({ eventsApi: { getAll: jest.fn() } }));
const render = component => renderComponent(component, { wrapper: MemoryRouter });

test('public member import includes only publication fields and every linked PDF exists', () => {
  expect(members).toHaveLength(102);
  expect(new Set(members.map(member => member.id)).size).toBe(102);
  expect(members.filter(member => member.group === 'member')).toHaveLength(74);
  expect(members.filter(member => member.group === 'board')).toHaveLength(19);
  expect(members.filter(member => member.group === 'instructor')).toHaveLength(5);
  expect(highBoard).toHaveLength(4);
  expect(members.filter(member => member.certificateUrl)).toHaveLength(101);
  members.forEach(member => {
    expect(Object.keys(member).filter(key => key !== 'bio').sort()).toEqual(['certificateUrl', 'fullName', 'group', 'id', 'imageUrl', 'positionTitle']);
    if (member.certificateUrl) {
      const filename = path.resolve(__dirname, '../../public', decodeURIComponent(member.certificateUrl).slice(1));
      expect(existsSync(filename)).toBe(true);
      expect(readFileSync(filename).subarray(0, 5).toString()).toBe('%PDF-');
    }
  });
  expect(members.find(member => member.fullName === 'Ali Arabi Ali')).toMatchObject({ group: 'high-board', certificateUrl: null });
});

test('published portraits are restricted to reviewed roster IDs with valid local JPEGs', () => {
  const reviewed = JSON.parse(readFileSync(path.resolve(__dirname, '../../scripts/member-photo-matches.json'), 'utf8'));
  const report = JSON.parse(readFileSync(path.resolve(__dirname, '../../scripts/member-photo-report.json'), 'utf8'));
  const portraits = members.filter(member => member.imageUrl);
  expect(reviewed).toHaveLength(59);
  expect(portraits).toHaveLength(58);
  expect(report).toHaveLength(102);
  expect(report.filter(entry => entry.status === 'matched')).toHaveLength(58);
  expect(report.filter(entry => entry.status === 'unassigned')).toHaveLength(43);
  expect(report.filter(entry => entry.status === 'conversion-skipped').map(entry => entry.id)).toEqual(['mai-elsayed-hafez-amen']);
  expect(new Set(reviewed.map(entry => entry.id)).size).toBe(reviewed.length);
  reviewed.forEach(entry => expect(members.some(member => member.id === entry.id)).toBe(true));
  expect(readdirSync(path.resolve(__dirname, '../../public/club-media/members')).sort()).toEqual(portraits.map(member => `${member.id}.jpg`).sort());
  portraits.forEach(member => {
    expect(reviewed.some(entry => entry.id === member.id)).toBe(true);
    expect(member.imageUrl).toBe(`/club-media/members/${member.id}.jpg`);
    const image = readFileSync(path.resolve(__dirname, '../../public', member.imageUrl.slice(1)));
    expect([...image.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
    expect(image.length).toBeGreaterThan(1000);
    expect(image.length).toBeLessThan(250000);
  });
});

test('a supplied portrait has the roster name as alt text and unassigned portraits keep initials', () => {
  const { rerender } = render(<MemberCard member={members.find(member => member.id === 'ali-arabi-ali')} />);
  expect(screen.getByRole('img', { name: 'Ali Arabi Ali' })).toHaveAttribute('src', '/club-media/members/ali-arabi-ali.jpg');
  expect(screen.getByRole('img', { name: 'Ali Arabi Ali' })).toHaveStyle({ objectFit: 'contain' });
  rerender(<MemberCard member={members.find(member => member.id === 'mai-elsayed-hafez-amen')} />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('ME')).toBeInTheDocument();
});

test('member directory paginates, searches and separates instructors from members and leadership', () => {
  render(<MembersPage />);
  expect(screen.getByText('74 people / Page 1 of 7')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(12);
  expect(screen.queryByText('Ali Arabi Ali')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByText('74 people / Page 2 of 7')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search people' }), { target: { value: '  MOSTAFA BAKRY  ' } });
  expect(screen.getByText('1 person / Page 1 of 1')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View certificate: Mostafa Bakry' })).toHaveAttribute('href', '/club-certificates/Certificate_Mostafa_Bakry.pdf');
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by role' }), { target: { value: 'Human Resources Generalist' } });
  expect(screen.getAllByRole('article')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Instructors 5' }));
  expect(screen.getByText('5 people / Page 1 of 1')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(5);
  fireEvent.change(screen.getByRole('textbox', { name: 'Search people' }), { target: { value: 'no-such-person' } });
  expect(screen.getByText('No people match your search.')).toBeInTheDocument();
});

test('leadership groups High Board and Board and omits unavailable certificate links', () => {
  render(<LeadershipPage />);
  const top = screen.getByRole('region', { name: 'High Board' });
  expect(within(top).getAllByRole('article')).toHaveLength(4);
  expect(within(screen.getByRole('region', { name: 'Board' })).getAllByRole('article')).toHaveLength(19);
  expect(screen.getByRole('heading', { name: 'Ali Arabi Ali' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'View certificate: Ali Arabi Ali' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search people' }), { target: { value: 'Ali Arabi Ali' } });
  expect(screen.getAllByRole('article')).toHaveLength(1);
});

test('homepage introduces all High Board members and links to the full leadership', () => {
  render(<HighBoardSection />);
  expect(screen.getAllByRole('article')).toHaveLength(4);
  expect(screen.getByRole('link', { name: 'Our leadership' })).toHaveAttribute('href', '/leadership');
});

test('achievements start honestly empty and accept future published records', () => {
  const { rerender } = render(<Achievements />);
  expect(screen.getByText('No student achievements have been published yet.')).toBeInTheDocument();
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  rerender(<Achievements entries={[{ id: 'test-award', title: 'Test award', studentNames: ['Test student'], achievedAt: '2026-09-01', summary: 'A test achievement.', imageUrl: null, evidenceUrl: 'https://example.com/award' }]} />);
  expect(screen.getByRole('heading', { name: 'Test award' })).toBeInTheDocument();
  expect(screen.getByText('Test student')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View achievement' })).toHaveAttribute('href', 'https://example.com/award');
});

test('member cards open a shareable profile containing the supplied biography', () => {
  renderComponent(<MemoryRouter initialEntries={['/leadership']}><Routes><Route path="/leadership" element={<LeadershipPage />} /><Route path="/members/:id" element={<MemberProfile />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('link', { name: 'View profile: Ali Arabi Ali' }));
  expect(screen.getByRole('heading', { level: 1, name: 'Ali Arabi Ali' })).toBeInTheDocument();
  expect(screen.getByText(/Microsoft Certified AI-900/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to people' })).toHaveAttribute('href', '/leadership');
  expect(screen.queryByRole('link', { name: 'View certificate' })).not.toBeInTheDocument();
});

test('unknown profile IDs have a recovery link without inventing a member', () => {
  renderComponent(<MemoryRouter initialEntries={['/members/not-a-member']}><Routes><Route path="/members/:id" element={<MemberProfile />} /></Routes></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Member not found' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to members' })).toHaveAttribute('href', '/members');
});