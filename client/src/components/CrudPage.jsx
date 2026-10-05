import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import Pager from './Pager.jsx';

const idOf = (v) => (v && typeof v === 'object' && v._id ? v._id : v);
const SKIP = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'photo', 'paper', 'user']);

/*
  fields:  [{ name, label, type: text|email|tel|password|date|number|select|multiselect|file, required,
              optionsFrom: '/classes', optionLabel: (o) => string }]
  columns: [{ label, render: (row) => node }]
  server:  true  -> the API paginates and searches (expects { items, total, page, pages })
  filter:  { name: 'classId', all: 'All classes', optionsFrom: '/classes', optionLabel } -> dropdown filter (server mode)
  extraActions: (row) => node, shown before Edit/Delete
*/
export default function CrudPage({ title, endpoint, fields, columns, server = false, filter, extraActions }) {
  const [rows, setRows] = useState([]);
  const [opts, setOpts] = useState({});
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const hasFile = fields.some((f) => f.type === 'file');

  const load = async () => {
    if (server) {
      const params = { page, limit };
      if (q) params.q = q;
      if (filter && filterVal) params[filter.name] = filterVal;
      const { data } = await api.get(endpoint, { params });
      setRows(data.items); setTotal(data.total); setPages(data.pages);
      if (data.page !== page) setPage(data.page);
    } else setRows((await api.get(endpoint)).data);
  };
  useEffect(() => { if (server) load().catch((e) => setListError(errMsg(e))); }, [server, page, limit, q, filterVal]);
  useEffect(() => { if (!server) load().catch((e) => setListError(errMsg(e))); }, []);
  useEffect(() => {
    [...fields.filter((f) => f.optionsFrom), ...(filter ? [{ ...filter, name: '__filter' }] : [])].forEach(async (f) => {
      const { data } = await api.get(f.optionsFrom);
      setOpts((o) => ({ ...o, [f.name]: data }));
    });
  }, []);
  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const set = (name, v) => setForm((f) => ({ ...f, [name]: v }));
  const startNew = () => { setForm({}); setEditing(null); setError(''); setFileKey((k) => k + 1); setOpen(true); };
  const close = () => { setOpen(false); setEditing(null); setForm({}); setError(''); };

  const edit = (row) => {
    setEditing(row._id);
    setError('');
    setFileKey((k) => k + 1);
    setForm(Object.fromEntries(fields.filter((f) => !['file', 'password'].includes(f.type)).map((f) => {
      const v = row[f.name];
      return [f.name, Array.isArray(v) ? v.map(idOf) : idOf(v) ?? ''];
    })));
    setOpen(true);
  };

  const payload = () => {
    if (!hasFile) return form;
    const fd = new FormData();
    fields.forEach((f) => {
      const v = form[f.name];
      if (f.type === 'file') { if (v) fd.append(f.name, v); }
      else if (Array.isArray(v)) v.forEach((x) => fd.append(f.name, x));
      else fd.append(f.name, v ?? (f.type === 'checkbox' ? (f.default ?? false) : ''));
    });
    return fd;
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (editing) await api.put(`${endpoint}/${editing}`, payload());
      else await api.post(endpoint, payload());
      close();
      await load();
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  const remove = async (row) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setListError('');
    try { await api.delete(`${endpoint}/${row._id}`); await load(); }
    catch (err) { setListError(errMsg(err)); }
  };

  const input = (f) => {
    const value = form[f.name] ?? (f.type === 'multiselect' ? [] : '');
    if (f.type === 'select')
      return (
        <select value={value} required={f.required} onChange={(e) => set(f.name, e.target.value)}>
          <option value="">Select…</option>
          {f.options ? f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>) : (opts[f.name] || []).map((o) => <option key={o._id} value={o._id}>{f.optionLabel(o)}</option>)}
        </select>
      );
    if (f.type === 'multiselect')
      return (
        <div className="chips">
          {(opts[f.name] || []).map((o) => (
            <label key={o._id} className="chip">
              <input type="checkbox" checked={value.includes(o._id)}
                onChange={(e) => set(f.name, e.target.checked ? [...value, o._id] : value.filter((x) => x !== o._id))} />
              {f.optionLabel(o)}
            </label>
          ))}
          {!(opts[f.name] || []).length && <span className="sub">Nothing to pick yet.</span>}
        </div>
      );
    if (f.type === 'file')
      return <input key={fileKey} type="file" accept="image/*" required={f.required && !editing} onChange={(e) => set(f.name, e.target.files[0])} />;
    if (f.type === 'textarea') return <textarea value={value} required={f.required} maxLength={f.maxLength} onChange={(e) => set(f.name, e.target.value)} />;
    if (f.type === 'checkbox') {
      const on = form[f.name] ?? (f.default ?? false);
      return <label className="chip"><input type="checkbox" checked={!!on} onChange={(e) => set(f.name, e.target.checked)} />{f.checkLabel || 'Yes'}</label>;
    }
    return <input type={f.type || 'text'} value={value} required={f.required && !(editing && f.type === 'password')}
      onChange={(e) => set(f.name, e.target.value)} />;
  };

  // server mode: rows are already one page. client mode: search and paginate here.
  const needle = q.toLowerCase();
  const filtered = server || !needle ? rows : rows.filter((r) => JSON.stringify(r, (k, v) => (SKIP.has(k) ? undefined : v)).toLowerCase().includes(needle));
  const count = server ? total : filtered.length;
  const pageCount = server ? pages : Math.max(Math.ceil(filtered.length / limit), 1);
  const cur = Math.min(page, pageCount);
  const shown = server ? rows : filtered.slice((cur - 1) * limit, cur * limit);

  return (
    <section>
      <div className="page-head">
        <div><h1>{title}</h1><p className="sub">{server ? total : rows.length} in total</p></div>
        <button onClick={startNew}><Icon name="plus" /> Add new</button>
      </div>

      <div className="toolbar">
        <label className="search"><Icon name="search" /><input placeholder={`Search ${title.toLowerCase()}…`} value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="Search" /></label>
        {filter && (
          <select className="filter-select" value={filterVal} onChange={(e) => { setFilterVal(e.target.value); setPage(1); }} aria-label={filter.all}>
            <option value="">{filter.all}</option>
            {(opts.__filter || []).map((o) => <option key={o._id} value={o._id}>{filter.optionLabel(o)}</option>)}
          </select>
        )}
      </div>
      {listError && <p className="msg bad">{listError}</p>}

      <div className="scroll">
        <table>
          <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th className="r">Actions</th></tr></thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row._id}>
                {columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}
                <td className="actions r">
                  {extraActions && extraActions(row)}
                  <button className="ghost sm" onClick={() => edit(row)}>Edit</button>
                  <button className="danger sm" onClick={() => remove(row)}>Delete</button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={columns.length + 1} className="empty">{q || filterVal ? 'No matches. Try a different search or filter.' : 'Nothing here yet. Use "Add new" to create the first entry.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={cur} pages={pageCount} total={count} limit={limit} onPage={setPage} onLimit={(n) => { setLimit(n); setPage(1); }} />

      {open && (
        <Modal title={editing ? `Edit ${title.toLowerCase()} entry` : `Add to ${title.toLowerCase()}`} onClose={close}>
          <form className="form cols" onSubmit={submit}>
            {fields.map((f) => (
              <label key={f.name} className={`field ${['multiselect', 'file', 'textarea'].includes(f.type) ? 'full' : ''}`}>
                <span>{f.type === 'password' && editing ? `${f.label} (leave blank to keep)` : f.label}</span>
                {input(f)}
                {f.warn && form[f.name] && f.warn(form[f.name]) && <small className="field-warn">{f.warn(form[f.name])}</small>}
              </label>
            ))}
            {error && <p className="msg bad full">{error}</p>}
            <div className="modal-foot full">
              <button type="button" className="ghost" onClick={close}>Cancel</button>
              <button disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add'}</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
