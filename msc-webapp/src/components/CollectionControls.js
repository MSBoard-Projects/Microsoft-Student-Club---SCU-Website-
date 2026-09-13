import React from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import './CollectionControls.css';

export const COLLECTION_PAGE_SIZE = 6;

export function CollectionToolbar({ label, search, onSearch, filter, onFilter, options = [], onRefresh, loading, onCreate, createLabel }) {
  return (
    <div className="collection-toolbar">
      <div className="collection-search">
        <FiSearch aria-hidden="true" />
        <input type="search" aria-label={`Search ${label}`} placeholder={`Search ${label}`} value={search} onChange={event => onSearch(event.target.value)} />
        {search && <button type="button" className="collection-icon" aria-label="Clear search" title="Clear search" onClick={() => onSearch('')}><FiX aria-hidden="true" /></button>}
      </div>
      {options.length > 0 && (
        <select aria-label={`Filter ${label}`} value={filter} onChange={event => onFilter(event.target.value)}>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
      <div className="collection-toolbar-actions">
        <button type="button" className="collection-icon" aria-label={`Refresh ${label}`} title={`Refresh ${label}`} onClick={onRefresh} disabled={loading}><FiRefreshCw aria-hidden="true" /></button>
        <button type="button" className="collection-create" onClick={onCreate}><FiPlus aria-hidden="true" />{createLabel}</button>
      </div>
    </div>
  );
}

export function CollectionPagination({ label, page, total, onPage }) {
  const pageCount = Math.max(1, Math.ceil(total / COLLECTION_PAGE_SIZE));
  return (
    <nav className="collection-pagination" aria-label={`${label} pagination`}>
      <p role="status">{total === 0 ? 0 : (page - 1) * COLLECTION_PAGE_SIZE + 1}-{Math.min(page * COLLECTION_PAGE_SIZE, total)} of {total} {label}</p>
      <div>
        <button type="button" className="collection-icon" aria-label="Previous page" title="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><FiChevronLeft aria-hidden="true" /></button>
        <span>Page {page} of {pageCount}</span>
        <button type="button" className="collection-icon" aria-label="Next page" title="Next page" disabled={page >= pageCount} onClick={() => onPage(page + 1)}><FiChevronRight aria-hidden="true" /></button>
      </div>
    </nav>
  );
}