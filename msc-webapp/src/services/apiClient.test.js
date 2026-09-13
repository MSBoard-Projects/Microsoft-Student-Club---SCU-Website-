import axios from 'axios';
import apiClient from './apiClient';

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

const clientOptions = axios.create.mock.calls[0][0];
const intercept = apiClient.interceptors.request.use.mock.calls[0][0];
const reject = apiClient.interceptors.response.use.mock.calls[0][1];

beforeEach(() => localStorage.clear());

test('creates a bounded API client', () => {
  expect(clientOptions).toEqual({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 15000,
  });
});

test('attaches the current token only when logged in', () => {
  expect(intercept({ headers: {} }).headers.Authorization).toBeUndefined();
  localStorage.setItem('authToken', 'test-token');
  expect(intercept({ headers: {} }).headers.Authorization).toBe('Bearer test-token');
});

test('clears a rejected session and notifies the auth provider', async () => {
  const expired = jest.fn();
  window.addEventListener('auth-expired', expired);
  localStorage.setItem('authToken', 'test-token');
  localStorage.setItem('user', '{}');
  const error = { response: { status: 401 }, config: { headers: { Authorization: 'Bearer test-token' } } };
  await expect(reject(error)).rejects.toBe(error);
  expect(localStorage.getItem('authToken')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
  expect(expired).toHaveBeenCalledTimes(1);
  window.removeEventListener('auth-expired', expired);
});

test('does not erase a newer session for an old request or a forbidden response', async () => {
  localStorage.setItem('authToken', 'new-token');
  const staleError = { response: { status: 401 }, config: { headers: { Authorization: 'Bearer old-token' } } };
  await expect(reject(staleError)).rejects.toBe(staleError);
  expect(localStorage.getItem('authToken')).toBe('new-token');
  const forbidden = { response: { status: 403 }, config: { headers: { Authorization: 'Bearer new-token' } } };
  await expect(reject(forbidden)).rejects.toBe(forbidden);
  expect(localStorage.getItem('authToken')).toBe('new-token');
});

test('does not send stale credentials to login or replace explicit logout credentials', () => {
  localStorage.setItem('authToken', 'current-token');
  expect(intercept({ url: '/auth/login', headers: {} }).headers.Authorization).toBeUndefined();
  expect(intercept({ url: '/auth/logout', headers: { Authorization: 'Bearer previous-token' } })
    .headers.Authorization).toBe('Bearer previous-token');
});