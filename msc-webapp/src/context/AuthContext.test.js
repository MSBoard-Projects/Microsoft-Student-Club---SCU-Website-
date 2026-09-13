import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AuthContext, { AuthProvider, useAuth } from './AuthContext';
import { adminUsersApi, authApi } from '../services/api';
import AdminUserManagement from '../pages/AdminUserManagement';

jest.mock('../services/api', () => ({
  authApi: { login: jest.fn(), getSession: jest.fn(), logout: jest.fn() },
  adminUsersApi: { getAll: jest.fn() },
}));

const session = () => ({ email: 'editor@example.test', role: 'ContentEditor', expiresAt: new Date(Date.now() + 3600000).toISOString() });

function SessionProbe() {
  const auth = useAuth();
  return <>
    <span>{auth.loading ? 'loading' : auth.isAuthenticated() ? auth.user.role : 'anonymous'}</span>
    <button onClick={() => auth.login(' editor@example.test ', 'password')}>Sign in</button>
    <button onClick={auth.logout}>Sign out</button>
  </>;
}

const mount = () => render(<AuthProvider><SessionProbe /></AuthProvider>);

beforeEach(() => {
  localStorage.clear();
  authApi.logout.mockResolvedValue(undefined);
});

test('fresh sessions never manufacture an admin login', async () => {
  mount();
  expect(await screen.findByText('anonymous')).toBeInTheDocument();
  expect(localStorage.getItem('authToken')).toBeNull();
  expect(authApi.getSession).not.toHaveBeenCalled();
});

test('real login, logout, and reload do not restore a fake session', async () => {
  authApi.login.mockResolvedValue({ token: 'real-token', ...session() });
  const view = mount();
  fireEvent.click(screen.getByText('Sign in'));
  expect(await screen.findByText('ContentEditor')).toBeInTheDocument();
  expect(authApi.login).toHaveBeenCalledWith('editor@example.test', 'password');
  expect(localStorage.getItem('authToken')).toBe('real-token');
  fireEvent.click(screen.getByText('Sign out'));
  expect(await screen.findByText('anonymous')).toBeInTheDocument();
  expect(authApi.logout).toHaveBeenCalledWith('real-token');
  view.unmount();
  mount();
  expect(await screen.findByText('anonymous')).toBeInTheDocument();
});

test('reload uses the server role instead of trusting cached privileges', async () => {
  localStorage.setItem('authToken', 'real-token');
  localStorage.setItem('user', JSON.stringify({ ...session(), role: 'SuperAdmin' }));
  authApi.getSession.mockResolvedValue(session());
  mount();
  expect(await screen.findByText('ContentEditor')).toBeInTheDocument();
  expect(authApi.getSession).toHaveBeenCalledTimes(1);
});

test('rejected stored sessions and rejected logins remain anonymous', async () => {
  localStorage.setItem('authToken', 'TEMPORARY_ADMIN_TOKEN_FOR_TESTING');
  authApi.getSession.mockRejectedValue(new Error('Unauthorized'));
  authApi.login.mockRejectedValue(new Error('Unauthorized'));
  mount();
  expect(await screen.findByText('anonymous')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Sign in'));
  await waitFor(() => expect(authApi.login).toHaveBeenCalledTimes(1));
  expect(localStorage.getItem('authToken')).toBeNull();
});

test('session expiry clears authentication without a reload', async () => {
  jest.useFakeTimers();
  try {
    authApi.login.mockResolvedValue({ token: 'real-token', ...session(), expiresAt: new Date(Date.now() + 1000).toISOString() });
    mount();
    await act(async () => fireEvent.click(screen.getByText('Sign in')));
    expect(screen.getByText('ContentEditor')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

test('content editors cannot open user management or fetch its data', () => {
  render(<AuthContext.Provider value={{ user: session(), isSuperAdmin: () => false }}>
    <AdminUserManagement />
  </AuthContext.Provider>);
  expect(screen.getByText('Access Denied')).toBeInTheDocument();
  expect(adminUsersApi.getAll).not.toHaveBeenCalled();
});