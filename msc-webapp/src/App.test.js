import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

let mockAuthenticated = false;
let mockRestoring = false;
const mockLogin = jest.fn();

jest.mock('./services/api', () => ({ showcaseApi: { get: jest.fn() } }));

jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: () => mockAuthenticated,
    loading: mockRestoring,
    login: mockLogin,
    user: mockAuthenticated ? { email: 'fixture@example.test', role: 'ContentEditor' } : null,
    isSuperAdmin: () => false,
  }),
}));
jest.mock('./components/PageTransition', () => ({ children }) => <div>{children}</div>);
jest.mock('./pages/ClubLanding', () => () => <h1>Club home</h1>);
jest.mock('./pages/MemberDirectory', () => ({ __esModule: true, default: () => <h1>Club members</h1>, LeadershipPage: () => <h1>Club leadership</h1> }));
jest.mock('./pages/Achievements', () => () => <h1>Student achievements</h1>);
jest.mock('./components/public/EventCollection', () => ({ __esModule: true, default: () => <h1>Club events</h1>, EventPage: () => <h1>Club event details</h1> }));
jest.mock('./pages/AdminDashboard', () => () => <h1>Admin overview</h1>);
jest.mock('./pages/ContentManagement', () => ({ kind }) => <h1>{kind === 'members' ? 'Member management' : kind === 'events' ? 'Event management' : 'Content management'}</h1>);
jest.mock('./pages/MemberManagement', () => () => <h1>Member management</h1>);
jest.mock('./pages/EventManagement', () => () => <h1>Event management</h1>);
jest.mock('./pages/SiteContentManagement', () => () => <h1>Site content</h1>);
jest.mock('./pages/AdminUserManagement', () => () => <h1>Admin users</h1>);

beforeEach(() => {
  mockAuthenticated = false;
  mockRestoring = false;
  window.scrollTo = jest.fn();
  window.history.replaceState(null, '', '/');
  mockLogin.mockImplementation(async () => {
    mockAuthenticated = true;
    return { success: true };
  });
});

const submitLogin = () => {
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'fixture@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Fixture-only-pass1!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

test('renders public routes and marks the active navigation link', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Club home' })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('link', { name: 'Members', exact: true })[0]);
  expect(await screen.findByRole('heading', { name: 'Club members' })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Members', exact: true })[0]).toHaveAttribute('aria-current', 'page');
});

test.each([['/members', 'Club members'], ['/leadership', 'Club leadership'], ['/achievements', 'Student achievements'], ['/events/orientation-season-2', 'Club event details'], ['/team', 'Club members']])('supports expanded public deep link %s', async (path, title) => {
  window.history.replaceState(null, '', path);
  render(<App />);
  expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  if (path === '/team') expect(window.location.pathname).toBe('/members');
});

test('unknown public routes offer a working return-home link', async () => {
  window.history.replaceState(null, '', '/missing-page');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Return home' }));
  expect(await screen.findByRole('heading', { name: 'Club home' })).toBeInTheDocument();
});

test('waits for session restoration before redirecting a protected deep link', async () => {
  mockRestoring = true;
  window.history.replaceState(null, '', '/admin/events');
  const { rerender } = render(<App />);
  expect(screen.getByRole('status', { name: 'Checking session' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/admin/events');
  expect(screen.queryByRole('heading', { name: 'Event management' })).not.toBeInTheDocument();
  mockRestoring = false;
  rerender(<App />);
  expect(await screen.findByRole('heading', { name: 'Admin Login' })).toBeInTheDocument();
});

test('restores an admin deep link including query and fragment after login', async () => {
  window.history.replaceState(null, '', '/admin/members?group=board#list');
  render(<App />);
  await screen.findByRole('heading', { name: 'Admin Login' });
  expect(window.location.pathname).toBe('/admin/login');
  submitLogin();
  expect(await screen.findByRole('heading', { name: 'Member management' })).toBeInTheDocument();
  expect(window.location.pathname + window.location.search + window.location.hash).toBe('/admin/members?group=board#list');
  expect(mockLogin).toHaveBeenCalledWith('fixture@example.test', 'Fixture-only-pass1!');
});

test.each(['https://example.test', '//example.test', '/admin/login', '/admin/missing', '/events'])('rejects an unsupported return destination: %s', async pathname => {
  window.history.replaceState({ usr: { from: { pathname } } }, '', '/admin/login');
  render(<App />);
  submitLogin();
  expect(await screen.findByRole('heading', { name: 'Admin overview' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/admin/dashboard');
});

test('shows login failures as an alert and allows another attempt', async () => {
  mockLogin.mockResolvedValueOnce({ success: false, error: 'Invalid credentials.' });
  window.history.replaceState(null, '', '/admin/login');
  render(<App />);
  submitLogin();
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials.');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled());
  expect(window.location.pathname).toBe('/admin/login');
  submitLogin();
  expect(await screen.findByRole('heading', { name: 'Admin overview' })).toBeInTheDocument();
});

test('authenticated unknown admin routes stay in the workspace and can return to overview', async () => {
  mockAuthenticated = true;
  window.history.replaceState(null, '', '/admin/missing');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Admin navigation' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Return to overview' }));
  expect(await screen.findByRole('heading', { name: 'Admin overview' })).toBeInTheDocument();
});
