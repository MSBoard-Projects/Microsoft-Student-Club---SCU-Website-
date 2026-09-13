import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminUserManagement from './AdminUserManagement';
import { adminUsersApi } from '../services/api';

const mockIsSuperAdmin = jest.fn();
let mockUser;
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser, isSuperAdmin: mockIsSuperAdmin }) }));
jest.mock('../services/api', () => ({ adminUsersApi: { getAll: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } }));

const users = Array.from({ length: 8 }, (_, index) => ({ id: index + 1, email: `admin${index + 1}@example.test`, role: index < 2 ? 'SuperAdmin' : 'ContentEditor' }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterAll(() => {
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});
beforeEach(() => {
  mockUser = users[0];
  mockIsSuperAdmin.mockReturnValue(true);
  adminUsersApi.getAll.mockResolvedValue(users);
});
afterEach(() => { jest.restoreAllMocks(); });

test('content editors cannot fetch accounts or access management controls', () => {
  mockIsSuperAdmin.mockReturnValue(false);
  render(<AdminUserManagement />);
  expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add Admin User' })).not.toBeInTheDocument();
  expect(adminUsersApi.getAll).not.toHaveBeenCalled();
});

test('combines email search and role filtering and resets pagination', async () => {
  render(<AdminUserManagement />);
  await screen.findByText('1-6 of 8 admin users');
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByText('7-8 of 8 admin users')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' ADMIN8@EXAMPLE.TEST ' } });
  expect(screen.getByText('1-1 of 1 admin users')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'SuperAdmin' } });
  expect(screen.getByText('No matching admin users')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByText('1-6 of 8 admin users')).toBeInTheDocument();
});

test('load errors are not empty results and refresh can recover', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  adminUsersApi.getAll.mockRejectedValueOnce(new Error('offline'));
  render(<AdminUserManagement />);
  await screen.findByText('Failed to load admin users. Please try again.');
  expect(screen.queryByText('No admin users yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh admin users' }));
  expect(await screen.findByText('1-6 of 8 admin users')).toBeInTheDocument();
});

test('protects own deletion and uses the full list for last-admin checks', async () => {
  render(<AdminUserManagement />);
  await screen.findByText('1-6 of 8 admin users');
  expect(screen.getByRole('button', { name: 'Delete admin1@example.test' })).toBeDisabled();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'admin2@' } });
  expect(screen.getByRole('button', { name: 'Delete admin2@example.test' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Edit admin2@example.test' }));
  expect(within(screen.getByRole('dialog')).getByLabelText(/Role/)).toBeEnabled();
});

test('prevents deletion and demotion of the last Super Admin', async () => {
  adminUsersApi.getAll.mockResolvedValue(users.filter(adminUser => adminUser.id !== 2));
  render(<AdminUserManagement />);
  await screen.findByText('1-6 of 7 admin users');
  expect(screen.getByRole('button', { name: 'Delete admin1@example.test' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Edit admin1@example.test' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByLabelText(/Role/)).toBeDisabled();
  fireEvent.change(within(dialog).getByLabelText(/Role/), { target: { value: 'ContentEditor' } });
  fireEvent.submit(dialog.querySelector('form'));
  expect(within(dialog).getByText('Cannot change the role of the last Super Admin.')).toBeInTheDocument();
  expect(adminUsersApi.update).not.toHaveBeenCalled();
});

test.each(['short1!A', 'lowercaseonly1!', 'UPPERCASEONLY1!', 'NoNumbersHere!', 'NoSymbolsHere12'])('rejects passwords that fail the existing policy: %s', async password => {
  render(<AdminUserManagement />);
  await screen.findByText('1-6 of 8 admin users');
  fireEvent.click(screen.getByRole('button', { name: 'Add Admin User' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText(/Email/), { target: { value: 'new@example.test' } });
  fireEvent.change(within(dialog).getByLabelText(/^Password/), { target: { value: password } });
  fireEvent.submit(dialog.querySelector('form'));
  expect(within(dialog).getByText(password.length < 12 ? 'Password must be at least 12 characters' : 'Include uppercase, lowercase, a number, and a symbol.')).toBeInTheDocument();
  expect(adminUsersApi.create).not.toHaveBeenCalled();
});

test('trims email on create and discards passwords when reopening the form', async () => {
  adminUsersApi.create.mockResolvedValueOnce({});
  render(<AdminUserManagement />);
  await screen.findByText('1-6 of 8 admin users');
  fireEvent.click(screen.getByRole('button', { name: 'Add Admin User' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText(/Email/), { target: { value: ' new@example.test ' } });
  fireEvent.change(within(dialog).getByLabelText(/^Password/), { target: { value: 'Fixture-pass123!' } });
  fireEvent.submit(dialog.querySelector('form'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(adminUsersApi.create).toHaveBeenCalledWith({ email: 'new@example.test', password: 'Fixture-pass123!', role: 'ContentEditor' });
  fireEvent.click(screen.getByRole('button', { name: 'Add Admin User' }));
  expect(within(screen.getByRole('dialog')).getByLabelText(/^Password/)).toHaveValue('');
});

test('preserves edit values on server validation errors and omits an unchanged password', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  let rejectSave;
  adminUsersApi.update.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectSave = reject; }));
  render(<AdminUserManagement />);
  await screen.findByText('1-6 of 8 admin users');
  fireEvent.click(screen.getByRole('button', { name: 'Edit admin3@example.test' }));
  const dialog = screen.getByRole('dialog');
  const email = within(dialog).getByLabelText(/Email/);
  fireEvent.change(email, { target: { value: 'changed@example.test' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
  expect(email).toBeDisabled();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(dialog).toBeInTheDocument();
  expect(adminUsersApi.update).toHaveBeenCalledWith(3, { email: 'changed@example.test', role: 'ContentEditor' });
  await act(async () => { rejectSave({ response: { data: { errors: { Email: ['Email already exists.'] } } } }); });
  expect(within(dialog).getByRole('alert')).toHaveTextContent('Email already exists.');
  expect(email).toHaveValue('changed@example.test');
  expect(email).toBeEnabled();
});

test('delete errors stay in confirmation and cancel does not write', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  adminUsersApi.delete.mockRejectedValueOnce(new Error('offline'));
  render(<AdminUserManagement />);
  await screen.findByText('1-6 of 8 admin users');
  fireEvent.click(screen.getByRole('button', { name: 'Delete admin3@example.test' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
  expect(adminUsersApi.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete admin3@example.test' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete User', exact: true }));
  expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Failed to delete admin user. Please try again.');
  expect(adminUsersApi.delete).toHaveBeenCalledWith(3);
});