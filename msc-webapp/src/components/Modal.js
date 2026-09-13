import React, { useEffect, useId, useRef } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Reusable Modal component
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  busy = false,
  closeOnOverlayClick = true
}) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full',
  };

  const requestClose = () => {
    if (!busy) onClose();
  };

  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) requestClose();
    }
  };

  return (
    <dialog ref={dialogRef} className={`club-dialog bg-white rounded-lg text-left shadow-xl ${sizeClasses[size]}`}
      aria-labelledby={titleId} aria-busy={busy} onClick={handleOverlayClick}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          requestClose();
        }
      }}
      onCancel={event => { event.preventDefault(); requestClose(); }}>
      <div className="bg-navy px-6 py-4 flex justify-between items-center gap-4">
        <h2 className="text-lg font-semibold text-white break-words min-w-0" id={titleId}>{title || 'Dialog'}</h2>
        <button type="button" onClick={requestClose} disabled={busy} aria-label="Close dialog" title="Close dialog" className="text-white hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed shrink-0 w-10 h-10 flex items-center justify-center"><FiX className="h-6 w-6" aria-hidden="true" /></button>
      </div>
      <div className="bg-white px-6 py-4">{children}</div>
      {footer && <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-end gap-3">{footer}</div>}
    </dialog>
  );
};

export default Modal;
