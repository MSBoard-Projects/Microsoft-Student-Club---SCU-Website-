import React, { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { eventsApi, membersApi, achievementsApi, showcaseApi, sponsorsApi } from '../services/api';
import { sponsorTiers } from '../content/sponsors';
import { publicContactFields } from '../content/members';
import { localShowcase, useShowcase } from '../context/ShowcaseContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormTextarea from '../components/FormTextarea';
import { CollectionToolbar, CollectionPagination, COLLECTION_PAGE_SIZE } from '../components/CollectionControls';
import './ContentManagement.css';

const definitions = {
  events: { title: 'Event management', singular: 'Event', api: eventsApi, fields: [
    ['title', 'Title', 'text', true], ['slug', 'Public link identifier', 'text'], ['category', 'Category', 'text'], ['summary', 'Short description', 'text'],
    ['description', 'Full description', 'textarea', true], ['startsAt', 'Start (date, month or ISO timestamp)', 'text'], ['endsAt', 'End (date, month or ISO timestamp)', 'text'],
    ['registrationUrl', 'MLH registration URL (HTTPS)', 'url'],
    ['location', 'Location', 'text'], ['imageUrl', 'Cover image URL', 'text'], ['gallery', 'Gallery URLs (one per line)', 'list'], ['isUpcoming', 'Upcoming', 'checkbox'], ['isFeatured', 'Featured', 'checkbox'],
  ] },
  members: { title: 'Member management', singular: 'Member', api: membersApi, fields: [
    ['fullName', 'Full name', 'text', true], ['positionTitle', 'Position title', 'text', true], ['memberTypeId', 'Member category', 'category', true],
    ['displayOrder', 'Display order', 'number'], ['imageUrl', 'Portrait URL', 'text'], ['certificateUrl', 'Certificate PDF URL', 'text'],
    ['bio', 'Biography', 'textarea'],
    ...publicContactFields.map(field => [field.key, field.type === 'url' ? `${field.label} URL (HTTPS)` : field.label, field.type]),
  ] },
  achievements: { title: 'Achievement management', singular: 'Achievement', api: achievementsApi, fields: [
    ['title', 'Title', 'text', true], ['studentNames', 'Student names (one per line)', 'list', true], ['summary', 'Description', 'textarea', true],
    ['achievedAt', 'Achievement date or month', 'text'], ['imageUrl', 'Image URL', 'text'], ['evidenceUrl', 'Evidence URL (HTTPS)', 'url'],
  ] },
  statistics: { title: 'Community statistics', fields: [
    ['registeredAttendees', 'Registered attendees', 'number'], ['eventLocations', 'Event locations', 'number'], ['beneficiaries', 'Beneficiaries', 'number'], ['eventsConducted', 'Events conducted', 'number'],
  ] },
  sponsors: { title: 'Sponsor management', singular: 'Sponsor', api: sponsorsApi, fields: [
    ['name', 'Sponsor name', 'text', true], ['tier', 'Sponsor tier', 'sponsor-tier', true], ['logoUrl', 'Logo URL', 'text'],
    ['websiteUrl', 'Website URL', 'url'], ['description', 'Description', 'textarea'], ['eventId', 'Associated event', 'event'],
    ['displayOrder', 'Display order', 'number'], ['isPublished', 'Published', 'checkbox'],
  ] },
};

const errorMessage = error => {
  const response = error.response?.data;
  if (response?.errors && typeof response.errors === 'object') return Object.values(response.errors).flat().join(' ');
  return response?.message || 'The request failed. Please try again.';
};
const toForm = (record, fields) => Object.fromEntries(fields.map(([key, , type]) => [key, type === 'list' ? (record[key] || []).join('\n') : record[key] ?? (type === 'checkbox' ? false : '')]));
const toPayload = (form, fields) => Object.fromEntries(fields.map(([key, , type, required]) => [key,
  type === 'list' ? form[key].split(/\r?\n/).map(value => value.trim()).filter(Boolean) : type === 'number' || type === 'category' || type === 'event' ? form[key] === '' ? null : Number(form[key]) : type === 'checkbox' ? form[key] : form[key].trim() || (required ? '' : null)]));

export function eventPayload(record) {
  const start = record.startsAt;
  const sortable = start && (/^\d{4}-\d{2}$/.test(start) ? `${start}-01T00:00:00Z` : /^\d{4}-\d{2}-\d{2}$/.test(start) ? `${start}T00:00:00Z` : start);
  return { ...record, eventDate: sortable && Number.isFinite(Date.parse(sortable)) ? new Date(sortable).toISOString() : record.eventDate || '0001-01-01T00:00:00' };
}

export function initialImport(memberTypes) {
  const names = { 'high-board': 'High Board', board: 'Board', member: 'Member', instructor: 'Instructor' };
  return {
    events: localShowcase.events.map(event => eventPayload({ ...event, id: 0, slug: event.id, isUpcoming: event.status === 'upcoming', isFeatured: false })),
    members: localShowcase.members.map((member, index) => {
      const category = memberTypes.find(type => type.typeName === names[member.group]);
      if (!category) throw new Error('Required member types are missing. Apply the prepared migration first.');
      return { ...member, id: 0, publicId: member.id, memberTypeId: category.id, displayOrder: index };
    }),
    statistics: { ...localShowcase.statistics, id: 1 },
  };
}

export default function ContentManagement({ kind = 'events' }) {
  const definition = definitions[kind];
  const { isSuperAdmin } = useAuth();
  const showcase = useShowcase();
  const [records, setRecords] = useState([]);
  const [types, setTypes] = useState([]);
  const [sponsorEvents, setSponsorEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({});
  const [mutationError, setMutationError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setEditor(null); setDeleting(null); setSearch(''); setPage(1);
    Promise.all([kind === 'statistics' ? showcaseApi.getStatistics() : definitions[kind].api.getAll(), showcaseApi.getMemberTypes(), kind === 'sponsors' ? eventsApi.getAll() : Promise.resolve([])])
      .then(([data, memberTypes, events]) => {
        if (!Array.isArray(memberTypes) || (kind !== 'statistics' && !Array.isArray(data))) throw new Error('Invalid response');
        if (!Array.isArray(events)) throw new Error('Invalid events response');
        if (active) { setTypes(memberTypes); setSponsorEvents(events); if (kind === 'statistics') setForm(toForm(data, definitions.statistics.fields)); else setRecords(data); }
      }).catch(failure => { if (active) setError(errorMessage(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, revision]);

  const openEditor = record => {
    const initial = record ? { ...record } : { isUpcoming: true, memberTypeId: types.find(type => type.typeName === 'Member')?.id || types[0]?.id, displayOrder: 0, tier: 'community', isPublished: false };
    if (kind === 'events' && !initial.startsAt && initial.eventDate && !initial.eventDate.startsWith('0001-')) initial.startsAt = initial.eventDate.slice(0, 10);
    setEditor({ record }); setForm(toForm(initial, definition.fields)); setMutationError('');
  };
  const refresh = () => { setRevision(value => value + 1); showcase.refresh(); };
  const save = async event => {
    event.preventDefault(); setBusy(true); setMutationError(''); setMessage('');
    try {
      let payload = { ...editor?.record, ...toPayload(form, definition.fields) };
      if (kind === 'events') payload = eventPayload(payload);
      if (kind === 'members' || kind === 'sponsors') payload.displayOrder = payload.displayOrder ?? 0;
      if (kind === 'statistics') await showcaseApi.saveStatistics(payload);
      else if (editor.record) await definition.api.update(editor.record.id, payload);
      else await definition.api.create(payload);
      setEditor(null); setMessage('Changes saved.'); refresh();
    } catch (failure) { setMutationError(errorMessage(failure)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setMutationError('');
    try { await definition.api.delete(deleting.id); setDeleting(null); setMessage('Record deleted.'); refresh(); }
    catch (failure) { setMutationError(errorMessage(failure)); } finally { setBusy(false); }
  };
  const importContent = async () => {
    setBusy(true); setMutationError('');
    try { const result = await showcaseApi.importContent(initialImport(types)); setImporting(false); setMessage(`Imported ${result.eventsAdded} events and ${result.membersAdded} members.`); refresh(); }
    catch (failure) { setMutationError(failure.response ? errorMessage(failure) : failure.message); } finally { setBusy(false); }
  };
  const fields = <div className="content-form-fields">{definition.fields.map(([key, label, type, required]) => {
    const update = event => setForm(previous => ({ ...previous, [key]: type === 'checkbox' ? event.target.checked : event.target.value }));
    if (type === 'checkbox') return <label key={key} className="content-checkbox"><input type="checkbox" checked={!!form[key]} onChange={update} disabled={busy} />{label}</label>;
    if (type === 'category') return <label key={key} className="content-category">{label}<select value={form[key] ?? ''} onChange={update} disabled={busy} required><option value="" disabled>Select category</option>{types.map(item => <option value={item.id} key={item.id}>{item.typeName}</option>)}</select></label>;
    if (type === 'sponsor-tier' || type === 'event') return <label key={key} className="content-category">{label}<select value={form[key] ?? ''} onChange={update} disabled={busy} required={required}>{type === 'event' ? <><option value="">Club-wide partner</option>{sponsorEvents.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</> : Object.entries(sponsorTiers).map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>;
    if (type === 'list' || type === 'textarea') return <FormTextarea key={key} name={key} label={label} value={form[key] ?? ''} onChange={update} required={required} disabled={busy} rows={4} />;
    return <FormInput key={key} name={key} label={label} type={type} value={form[key] ?? ''} onChange={update} required={required} disabled={busy} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 2147483647 : undefined} step={type === 'number' ? 1 : undefined} />;
  })}</div>;
  const filtered = records.filter(record => `${record.title || record.fullName || record.name} ${record.positionTitle || record.summary || record.tier || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const visible = filtered.slice((page - 1) * COLLECTION_PAGE_SIZE, page * COLLECTION_PAGE_SIZE);

  return <div className="collection-page content-manager">
    <div className="collection-heading"><h1>{definition.title}</h1>{isSuperAdmin() && <Button variant="secondary" onClick={() => { setImporting(true); setMutationError(''); }} disabled={loading || !!error}><FiUploadCloud aria-hidden="true" />Import initial catalogue</Button>}</div>
    {message && <p role="status" className="content-save-status">{message}</p>}
    {loading ? <p role="status">Loading content...</p> : error ? <div role="alert" className="collection-empty">{error}<Button onClick={refresh}>Try again</Button></div> : kind === 'statistics' ? <form onSubmit={save} className="content-statistics-form">{fields}{mutationError && <p role="alert">{mutationError}</p>}<Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save statistics'}</Button></form> : <>
      <CollectionToolbar label={kind} search={search} onSearch={value => { setSearch(value); setPage(1); }} onRefresh={refresh} loading={loading} onCreate={() => openEditor(null)} createLabel={`Add ${definition.singular}`} />
      <p className="content-record-count">{filtered.length} records</p>
      {filtered.length ? <><div className="content-records">{visible.map(record => <article key={record.id} className="content-record"><div><h2>{record.title || record.fullName || record.name}</h2><p>{record.positionTitle || record.startsAt || record.achievedAt || record.summary || (kind === 'sponsors' ? `${sponsorTiers[record.tier]} / ${record.isPublished ? 'Published' : 'Draft'}` : '')}</p></div><div className="content-record-actions"><button type="button" title="Edit" aria-label={`Edit ${record.title || record.fullName || record.name}`} onClick={() => openEditor(record)}><FiEdit2 /></button><button type="button" title="Delete" aria-label={`Delete ${record.title || record.fullName || record.name}`} onClick={() => { setDeleting(record); setMutationError(''); }}><FiTrash2 /></button></div></article>)}</div><CollectionPagination label={kind} page={page} onPage={setPage} total={filtered.length} /></> : <p className="collection-empty">No matching records.</p>}
    </>}
    <Modal isOpen={!!editor} onClose={() => setEditor(null)} title={`${editor?.record ? 'Edit' : 'Add'} ${definition.singular}`} size="lg" busy={busy}><form onSubmit={save}>{fields}{mutationError && <p role="alert" className="content-mutation-error">{mutationError}</p>}<div className="content-form-actions"><Button variant="secondary" onClick={() => setEditor(null)} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</Button></div></form></Modal>
    <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete record" busy={busy}><p>Delete {deleting?.title || deleting?.fullName || deleting?.name}? This cannot be undone.</p>{mutationError && <p role="alert">{mutationError}</p>}<div className="content-form-actions"><Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button><Button variant="danger" onClick={remove} disabled={busy}>Delete record</Button></div></Modal>
    <Modal isOpen={importing} onClose={() => setImporting(false)} title="Import initial catalogue" busy={busy}><p>Add missing records from the confirmed catalogue: {localShowcase.events.length} events and {localShowcase.members.length} people. Existing records and statistics will not be overwritten.</p>{mutationError && <p role="alert">{mutationError}</p>}<div className="content-form-actions"><Button variant="secondary" onClick={() => setImporting(false)} disabled={busy}>Cancel</Button><Button onClick={importContent} disabled={busy}>{busy ? 'Importing...' : 'Confirm import'}</Button></div></Modal>
  </div>;
}