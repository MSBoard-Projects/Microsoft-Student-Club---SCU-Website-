import React, { useEffect, useState } from 'react';
import { FiDownload, FiUploadCloud } from 'react-icons/fi';
import { leaderboardApi, membersApi } from '../services/api';
import { parseRatings } from '../content/ratings';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Modal from '../components/Modal';
import { CollectionPagination } from '../components/CollectionControls';
import './ContentManagement.css';

const messageFrom = error => error.response?.data?.message || (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(' ') : 'The request failed. Please try again.');

export default function RatingManagement() {
  const [periods, setPeriods] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([leaderboardApi.getAll(), membersApi.getAll()]).then(([data, people]) => {
      const records = parseRatings(data);
      if (!Array.isArray(people)) throw new Error('Invalid member data');
      if (active) { setPeriods(records); setMembers(people); }
    }).catch(failure => { if (active) setError(messageFrom(failure)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  const change = event => {
    setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
    setPreview(null); setMutationError(''); setMessage('');
  };
  const selectFile = event => {
    const selected = event.target.files?.[0] || null;
    setPreview(null); setMutationError(''); setMessage('');
    if (selected && (!/\.xlsx$/i.test(selected.name) || selected.size > 2 * 1024 * 1024 || selected.size === 0)) {
      setFile(null); event.target.value = ''; setMutationError('Choose a nonempty XLSX file no larger than 2 MB.');
    } else setFile(selected);
  };
  const downloadTemplate = async () => {
    setBusy(true); setMutationError('');
    try {
      const blob = await leaderboardApi.template();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'msc-ratings.xlsx'; anchor.click(); URL.revokeObjectURL(url);
    } catch (failure) { setMutationError(messageFrom(failure)); } finally { setBusy(false); }
  };
  const inspect = async event => {
    event.preventDefault(); setMutationError(''); setPreview(null); setMessage('');
    if (!file || !form.startDate || form.endDate < form.startDate) { setMutationError('Choose a workbook and valid period dates.'); return; }
    setBusy(true);
    try {
      const data = new FormData(); data.append('file', file); data.append('startDate', form.startDate); data.append('endDate', form.endDate);
      const result = await leaderboardApi.preview(data);
      if (!result || !Array.isArray(result.rows) || !Array.isArray(result.errors)) throw new Error('Invalid preview response');
      setPreview(result); setPage(1);
    } catch (failure) { setMutationError(messageFrom(failure)); } finally { setBusy(false); }
  };
  const publish = async () => {
    if (!preview || preview.errors.length || !preview.rows.length) return;
    setBusy(true); setMutationError('');
    try {
      const result = await leaderboardApi.publish({ ...form, entries: preview.rows,
        replacePeriodId: preview.existingPeriod?.id ?? null, expectedVersion: preview.existingPeriod?.version ?? null });
      setConfirming(false); setPreview(null); setMessage(`${result.entriesPublished} ratings published.`); setRevision(value => value + 1);
    } catch (failure) {
      setMutationError(messageFrom(failure));
      if (failure.response?.status === 409) { setConfirming(false); setPreview(null); }
    } finally { setBusy(false); }
  };
  const names = new Map(members.map(member => [member.publicId || String(member.id), member.fullName]));
  return <div className="collection-page content-manager">
    <div className="collection-heading"><h1>Rating imports</h1><Button variant="secondary" onClick={downloadTemplate} disabled={busy || loading || !!error}><FiDownload aria-hidden="true" />Download Excel template</Button></div>
    {message && <p className="content-save-status" role="status">{message}</p>}
    {loading ? <p role="status">Loading rating periods...</p> : error ? <div role="alert">{error}<Button onClick={() => setRevision(value => value + 1)}>Try again</Button></div> : <>
      <form className="rating-import-form" onSubmit={inspect}>
        <FormInput name="title" label="Period title" value={form.title} onChange={change} maxLength={120} required disabled={busy} />
        <FormInput name="startDate" label="Period start" type="date" value={form.startDate} onChange={change} required disabled={busy} min="2000-01-01" />
        <FormInput name="endDate" label="Period end" type="date" value={form.endDate} onChange={change} required disabled={busy} min={form.startDate || '2000-01-01'} />
        <label className="rating-file-label">Ratings workbook (.xlsx)<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={selectFile} disabled={busy} required /></label>
        <Button type="submit" disabled={busy || !file}><FiUploadCloud aria-hidden="true" />{busy ? 'Working...' : 'Preview workbook'}</Button>
      </form>
      {mutationError && !confirming && <p role="alert" className="content-mutation-error">{mutationError}</p>}
      {preview && <section className="rating-preview" aria-labelledby="rating-preview-title"><h2 id="rating-preview-title">Import preview</h2><p>{preview.rows.length} rated rows / {preview.ignoredRows} blank rows skipped</p>
        {!!preview.errors.length && <div role="alert"><h3>{preview.errors.length} issues prevent publication</h3><ul className="rating-errors">{preview.errors.map((issue, index) => <li key={index}>{issue}</li>)}</ul></div>}
        {preview.existingPeriod && <p className="rating-replace-warning">An existing period will be replaced: {preview.existingPeriod.title}. Other periods will remain unchanged.</p>}
        <div className="rating-table-scroll"><table className="rating-table"><caption>Scores from the uploaded workbook</caption><thead><tr><th>Member</th><th>Rate / 100</th><th>Online</th><th>Offline</th><th>Tasks</th><th>Projects</th></tr></thead><tbody>{preview.rows.slice((page - 1) * 6, page * 6).map((row, index) => <tr key={`${row.memberId}-${index}`}><th scope="row">{names.get(row.memberId) || row.memberId}<small>{row.memberId}</small></th>{['rate', 'onlineAttendance', 'offlineAttendance', 'tasks', 'projects'].map(key => <td key={key}>{row[key] ?? 'Not reported'}</td>)}</tr>)}</tbody></table></div>
        <CollectionPagination label="rating rows" page={page} onPage={setPage} total={preview.rows.length} />
        <Button onClick={() => { setConfirming(true); setMutationError(''); }} disabled={busy || !!preview.errors.length || !preview.rows.length}>Review publication</Button>
      </section>}
      <section className="rating-history"><h2>Published periods</h2>{periods.length ? <ul>{periods.map(period => <li key={period.id}><strong>{period.title}</strong><span>{period.startDate} - {period.endDate}</span><span>{period.entries.length} rated people</span></li>)}</ul> : <p>No rating periods published yet.</p>}</section>
    </>}
    <Modal isOpen={confirming} onClose={() => setConfirming(false)} title={preview?.existingPeriod ? 'Replace rating period' : 'Publish rating period'} busy={busy}>
      <p>{form.title}: {form.startDate} - {form.endDate}</p><p>Publish {preview?.rows.length ?? 0} final ratings publicly?</p>
      {preview?.existingPeriod && <p>All ratings in this existing period will be replaced by the previewed rows. Members omitted from the workbook will no longer be rated in this period.</p>}
      {mutationError && <p role="alert">{mutationError}</p>}
      <div className="content-form-actions"><Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>Cancel</Button><Button onClick={publish} disabled={busy}>{busy ? 'Publishing...' : 'Confirm publication'}</Button></div>
    </Modal>
  </div>;
}