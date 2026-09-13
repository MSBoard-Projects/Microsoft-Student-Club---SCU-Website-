import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Modal from './Modal';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

afterAll(() => {
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Open editor</button><Modal isOpen={open} onClose={() => setOpen(false)} title="Edit member"><input aria-label="Full name" /></Modal></>;
}

test('opens a named native dialog and restores focus and scroll on close', () => {
  render(<ModalHarness />);
  const trigger = screen.getByRole('button', { name: 'Open editor' });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Edit member' })).toHaveAttribute('open');
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe('');
});

test('the native cancel event closes the controlled dialog', () => {
  render(<ModalHarness />);
  fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('Escape closes the dialog even without a native cancel event', () => {
  render(<ModalHarness />);
  fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
  fireEvent.keyDown(screen.getByRole('textbox', { name: 'Full name' }), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('busy dialogs block all close paths and become dismissible after the request', () => {
  const onClose = jest.fn();
  const { rerender } = render(<Modal isOpen busy onClose={onClose} title="Saving content"><input aria-label="Content" /></Modal>);
  const dialog = screen.getByRole('dialog', { name: 'Saving content' });
  expect(dialog).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('button', { name: 'Close dialog' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  fireEvent.keyDown(dialog, { key: 'Escape' });
  fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
  fireEvent.click(dialog, { clientX: -1, clientY: -1 });
  expect(onClose).not.toHaveBeenCalled();
  rerender(<Modal isOpen busy={false} onClose={onClose} title="Saving content"><input aria-label="Content" /></Modal>);
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});