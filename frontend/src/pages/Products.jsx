import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import ProductForm from '../components/ProductForm.jsx';

const LIMIT = 20;
const rupiah = (v) => Number(v).toLocaleString('id-ID');

export default function Products() {
    const { user } = useAuth();
    const isAdmin = user.role === 'admin';

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState(null); // null = tutup, {} = tambah, objek barang = edit
    const [error, setError] = useState('');

    const selected = items.find((p) => p.id === selectedId) ?? null;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    const load = useCallback(async () => {
        try {
            const res = await api(`/products?q=${encodeURIComponent(q)}&page=${page}&limit=${LIMIT}`);
            setItems(res.data);
            setTotal(res.total);
            setError('');
        }   catch (e) {
            setError(e.message);
        }
    }, [q, page]);

    // Ambil data tiap kata kunci/halaman berubah. Jeda 300 ms (debounce)
    // supaya tidak memanggil server di setiap ketukan huruf.
    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    async function remove() {
        if (!isAdmin || !selected) return;
        if (!window.confirm(`Apakah Anda yakin ingin menghapus barang dengan kode ${selected.code}?`)) return;
        try {
            await api(`/products/${selected.id}`, { method: 'DELETE' });
            setSelectedId(null);
            load();
        } catch (e) {
            setError(e.message);
        }
    }
    
    // Shortcut keyboard seperti sistem lama: F4 / F2 / F5 / F8 + panah.
// Tanpa array dependency, listener dipasang ulang tiap render,
// jadi fungsi di dalamnya selalu memakai state terbaru.
useEffect(() => {
  function onKey(e) {
    if (form) return;
    if (e.key === 'F4') {
      e.preventDefault();
      if (isAdmin) setForm({});
    } else if (e.key === 'F2') {
      e.preventDefault();
      if (isAdmin && selected) setForm(selected);
    } else if (e.key === 'F5') {
      e.preventDefault();
      remove();
    } else if (e.key === 'F8') {
      e.preventDefault();
      load();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const idx = items.findIndex((p) => p.id === selectedId);
      const next =
        e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
      if (items[next]) setSelectedId(items[next].id);
    }
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
});

  function handleSaved() {
    setForm(null);
    load();
  }

  return (
    <div>
      <div className="toolbar">
        <h2>Data Barang</h2>
        <input
          className="search"
          placeholder="Cari kode atau nama barang..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kode barang</th>
              <th>Nama barang</th>
              <th>Satuan</th>
              <th>Kategori</th>
              {isAdmin && <th className="num">Harga beli</th>}
              <th className="num">Harga jual</th>
              {isAdmin && <th className="num">Laba</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr
                key={p.id}
                className={p.id === selectedId ? 'selected' : ''}
                onClick={() => setSelectedId(p.id)}
                onDoubleClick={() => isAdmin && setForm(p)}
              >
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.unit}</td>
                <td>{p.category ?? '-'}</td>
                {isAdmin && <td className="num">{rupiah(p.buy_price)}</td>}
                <td className="num">{rupiah(p.sell_price)}</td>
                {isAdmin && <td className="num">{rupiah(p.profit)}</td>}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">Tidak ada barang</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="footer-bar">
        <div className="actions">
          <button className="btn" disabled={!isAdmin} onClick={() => setForm({})}>Tambah (F4)</button>
          <button className="btn" disabled={!isAdmin || !selected} onClick={() => setForm(selected)}>Edit (F2)</button>
          <button className="btn danger" disabled={!isAdmin || !selected} onClick={remove}>Delete (F5)</button>
          <button className="btn" onClick={load}>Refresh (F8)</button>
        </div>
        <div className="pager">
          <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          <span>Halaman {page} / {totalPages} · {total} barang</span>
          <button className="btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
        </div>
      </div>

      {form && (
        <ProductForm
          product={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}