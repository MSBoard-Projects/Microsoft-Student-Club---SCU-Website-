import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AdminLayout from './AdminLayout';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  NavLink: ({ to, children, className }) => <a href={to} className={className({ isActive: false })}>{children}</a>,
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
  useOutlet: () => <div>Route content</div>,
}), { virtual: true });
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: { div: ({ children }) => <div>{children}</div> },
  useReducedMotion: () => true,
}));
jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { warning: jest.fn(), error: jest.fn() } }));

const navigate = jest.fn();
const logout = jest.fn();
const originalScrollTo = window.scrollTo;

beforeAll(() => { window.scrollTo = jest.fn(); });
afterAll(() => { window.scrollTo = originalScrollTo; });
beforeEach(() => {
  useLocation.mockReturnValue({ pathname: '/admin/dashboard' });
  useNavigate.mockReturnValue(navigate);
  logout.mockResolvedValue({ success: true });
  useAuth.mockReturnValue({ user: { email: 'editor@example.test', role: 'ContentEditor' }, isSuperAdmin: () => false, logout });
});

test('only SuperAdmins see the user management link and deferred modules are not links', () => {
  const view = render(<AdminLayout />);
  expect(screen.queryByRole('link', { name: 'Admin users' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ratings & Excel' })).toHaveAttribute('href', '/admin/ratings');
  expect(screen.getByRole('link', { name: 'Sponsors & partners' })).toHaveAttribute('href', '/admin/sponsors');
  expect(screen.getByText('QR attendance').closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true');
  expect(screen.queryByRole('link', { name: 'QR attendance' })).not.toBeInTheDocument();
  useAuth.mockReturnValue({ user: { email: 'admin@example.test', role: 'SuperAdmin' }, isSuperAdmin: () => true, logout });
  view.rerender(<AdminLayout />);
  expect(screen.getByRole('link', { name: 'Admin users' })).toHaveAttribute('href', '/admin/users');
});

test('mobile navigation scrolls into view and Escape restores focus', () => {
  render(<AdminLayout />);
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute('aria-expanded', 'true');
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  fireEvent.keyDown(screen.getByRole('button', { name: 'Close navigation' }), { key: 'Escape' });
  expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
});

test('logout reports unconfirmed revocation instead of silently claiming success', async () => {
  logout.mockResolvedValue({ success: false, error: 'Server logout not confirmed' });
  render(<AdminLayout />);
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin/login', { replace: true }));
  expect(logout).toHaveBeenCalledTimes(1);
  expect(toast.warning).toHaveBeenCalledWith('Server logout not confirmed');
});