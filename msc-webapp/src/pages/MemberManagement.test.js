import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MemberManagement from './MemberManagement';
import { membersApi } from '../services/api';

jest.mock('../services/api', () => ({ membersApi: { getAll: jest.fn() } }));
jest.mock('../components/ImageUpload', () => () => <div>Image upload</div>);

const members = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1, fullName: `Member ${index + 1}`, positionTitle: index === 6 ? 'Cloud Lead' : 'Coordinator',
  memberTypeId: index === 6 ? 2 : 1, email: `member${index + 1}@example.test`
}));

beforeEach(() => {
  membersApi.getAll.mockResolvedValue(members);
});

test('paginates members and combines search with type filtering', async () => {
  render(<MemberManagement />);
  expect(await screen.findByText('1-6 of 7 members')).toBeInTheDocument();
  expect(screen.queryByText('Member 7')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByText('7-7 of 7 members')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search members' }), { target: { value: ' CLOUD ' } });
  expect(screen.getByText('1-1 of 1 members')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter members' }), { target: { value: '1' } });
  expect(screen.getByText('No matching members')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByText('1-6 of 7 members')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'MEMBER7@EXAMPLE.TEST' } });
  expect(screen.getByText('Member 7')).toBeInTheDocument();
});

test('does not claim an empty collection after a failed request and retries', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  membersApi.getAll.mockRejectedValueOnce(new Error('offline'));
  render(<MemberManagement />);
  expect(await screen.findByText('Failed to load members. Please try again.')).toBeInTheDocument();
  expect(screen.queryByText('No members yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh members' }));
  expect(await screen.findByText('Member 1')).toBeInTheDocument();
  consoleError.mockRestore();
});

test('refresh resets pagination when the collection shrinks', async () => {
  render(<MemberManagement />);
  await screen.findByText('Member 1');
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  membersApi.getAll.mockResolvedValueOnce(members.slice(0, 1));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh members' }));
  expect(await screen.findByText('1-1 of 1 members')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
});

test('keeps previously loaded members browsable when refresh fails', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<MemberManagement />);
  await screen.findByText('Member 1');
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  membersApi.getAll.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh members' }));
  await screen.findByText('Failed to load members. Please try again.');
  expect(screen.getByText('Member 7')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
  expect(screen.getByText('Member 1')).toBeInTheDocument();
  consoleError.mockRestore();
});