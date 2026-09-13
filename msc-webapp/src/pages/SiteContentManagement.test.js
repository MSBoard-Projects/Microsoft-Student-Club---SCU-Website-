import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SiteContentManagement from './SiteContentManagement';
import { siteContentApi } from '../services/api';

jest.mock('../services/api', () => ({ siteContentApi: { getAll: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } }));

const contents = Array.from({ length: 7 }, (_, index) => ({ id: index + 1, contentKey: `section-${index + 1}`, contentValue: index === 6 ? 'Our vision' : 'Club content' }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterAll(() => {
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});
beforeEach(() => { siteContentApi.getAll.mockResolvedValue(contents); });
afterEach(() => { jest.restoreAllMocks(); });

test('searches keys and text, resets pagination and clears no-match results', async () => {
  render(<SiteContentManagement />);
  await screen.findByText('1-6 of 7 content entries');
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.getByText('7-7 of 7 content entries')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' VISION ' } });
  expect(screen.getByText('1-1 of 1 content entries')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } });
  expect(screen.getByText('No matching content')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'section-2' } });
  expect(screen.getByRole('heading', { name: 'section-2' })).toBeInTheDocument();
});

test('distinguishes initial load failure from empty content and supports retry', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  siteContentApi.getAll.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  render(<SiteContentManagement />);
  await screen.findByText('Failed to load site content. Please try again.');
  expect(screen.queryByText('No site content yet')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh content' }));
  expect(await screen.findByText('No site content yet')).toBeInTheDocument();
});

test('retains cached pages after failed refresh and resets after the list shrinks', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<SiteContentManagement />);
  await screen.findByText('1-6 of 7 content entries');
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  siteContentApi.getAll.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh content' }));
  await screen.findByText('Failed to load site content. Please try again.');
  fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
  expect(screen.getByRole('heading', { name: 'section-1' })).toBeInTheDocument();
  siteContentApi.getAll.mockResolvedValueOnce(contents.slice(0, 1));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh content' }));
  expect(await screen.findByText('1-1 of 1 content entries')).toBeInTheDocument();
});

test('validates keys and whitespace-only values without submitting', async () => {
  render(<SiteContentManagement />);
  await screen.findByText('1-6 of 7 content entries');
  fireEvent.click(screen.getByRole('button', { name: 'Add Content' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText(/Content Key/), { target: { value: 'bad key' } });
  fireEvent.change(within(dialog).getByLabelText(/Content Value/), { target: { value: '   ' } });
  fireEvent.submit(dialog.querySelector('form'));
  expect(within(dialog).getByText(/Content key can only contain/)).toBeInTheDocument();
  expect(within(dialog).getByText('Content value is required')).toBeInTheDocument();
  expect(siteContentApi.create).not.toHaveBeenCalled();
});

test('preserves drafts and reports save failures inside the busy-protected editor', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  let rejectSave;
  siteContentApi.update.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectSave = reject; }));
  render(<SiteContentManagement />);
  await screen.findByText('1-6 of 7 content entries');
  fireEvent.click(screen.getByRole('button', { name: 'Edit section-1' }));
  const dialog = screen.getByRole('dialog', { name: 'Edit Content' });
  expect(within(dialog).getByLabelText(/Content Key/)).toBeDisabled();
  const value = within(dialog).getByLabelText(/Content Value/);
  fireEvent.change(value, { target: { value: 'New text\nSecond line' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
  expect(value).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: 'Close dialog' })).toBeDisabled();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(dialog).toBeInTheDocument();
  await act(async () => { rejectSave({ response: { data: { message: 'Save rejected.' } } }); });
  expect(within(dialog).getByRole('alert')).toHaveTextContent('Save rejected.');
  expect(value).toHaveValue('New text\nSecond line');
  expect(value).toBeEnabled();
  expect(siteContentApi.update).toHaveBeenCalledWith('section-1', { contentValue: 'New text\nSecond line' });
  siteContentApi.update.mockResolvedValueOnce({});
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(siteContentApi.getAll).toHaveBeenCalledTimes(2);
});

test('delete failures stay inside confirmation and cancel never writes', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  siteContentApi.delete.mockRejectedValueOnce(new Error('offline'));
  render(<SiteContentManagement />);
  await screen.findByText('1-6 of 7 content entries');
  fireEvent.click(screen.getByRole('button', { name: 'Delete section-1' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
  expect(siteContentApi.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete section-1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete Content' }));
  expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Failed to delete content. Please try again.');
  expect(siteContentApi.delete).toHaveBeenCalledWith('section-1');
});