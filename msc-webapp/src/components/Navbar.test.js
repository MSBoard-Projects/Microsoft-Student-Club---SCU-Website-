import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Navbar from './public/PublicHeader';

let mockPathname = '/';
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ pathname: mockPathname }),
}), { virtual: true });

beforeEach(() => { mockPathname = '/'; });

test('announces the mobile menu state and closes with Escape restoring focus', () => {
  render(<Navbar />);
  const toggle = screen.getByRole('button', { name: 'Open navigation' });
  const menu = document.getElementById(toggle.getAttribute('aria-controls'));
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(menu).not.toBeVisible();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(menu).toBeVisible();
  within(menu).getByRole('link', { name: 'Members' }).focus();
  fireEvent.keyDown(document.activeElement, { key: 'Escape' });
  expect(menu).not.toBeVisible();
  expect(toggle).toHaveFocus();
});

test('marks the active page and closes the menu on navigation or history changes', () => {
  const { rerender } = render(<Navbar />);
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  const menu = document.getElementById('public-mobile-navigation');
  fireEvent.click(within(menu).getByRole('link', { name: 'Members' }));
  expect(menu).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  mockPathname = '/events';
  rerender(<Navbar />);
  expect(menu).not.toBeVisible();
  expect(screen.getByRole('link', { name: 'Events' })).toHaveAttribute('aria-current', 'page');
});

test('does not display public navigation inside the admin workspace', () => {
  mockPathname = '/admin/members';
  render(<Navbar />);
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});