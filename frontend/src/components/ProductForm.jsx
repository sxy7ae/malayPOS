import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const empty = {
  code: '', name: '', categoryId: '', supplierId: '',
  unit: 'buah', buyPrice: '', sellPrice: '', minStock: 0,
};

export default function ProductForm({ product, onClose, onSaved }) {
  const editing = Boolean(product?.id);
  const formRef = useRef(null);

  const [values, setValues] = useState(() =>
    editing
      ? {
          code: product.code,
          name: product.name,
          categoryId: product.category_id ?? '',
          supplierId: product.supplier_id ?? '',
          unit: product.unit,
          buyPrice: Number(product.buy_price),
          sellPrice: Number(product.sell_price),
          minStock: Number(product.min_stock),
        }
      : empty
  );
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Isi dropdown kategori dan supplier sekali saat form dibuka.
  useEffect(() => {
    Promise.all([api('/categories'), api('/suppliers')])
      .then(([c, s]) => {
        setCategories(c.data);
        setSuppliers(s.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Pembuat handler: set('name') menghasilkan fungsi untuk kolom "name".
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const buy = Number(values.buyPrice);
  const sell = Number(values.sellPrice);
  const marginPct = buy > 0 ? (((sell - buy) / buy) * 100).toFixed(2) : '-';

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      code: values.code,
      name: values.name,
      categoryId: values.categoryId ? Number(values.categoryId) : null,
      supplierId: values.supplierId ? Number(values.supplierId) : null,
      unit: values.unit,
      buyPrice: Number(values.buyPrice),
      sellPrice: Number(values.sellPrice),
      minStock: Number(values.minStock || 0),
    };
    try {
      await api(editing ? `/products/${product.id}` : '/products', {
        method: editing ? 'PUT' : 'POST',
        body,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  // Esc = tutup, F4 = simpan (sama seperti sistem lama).
  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
    if (e.key === 'F4') {
      e.preventDefault();
      formRef.current.requestSubmit();
    }
  }

  return (
    <div className="overlay" onKeyDown={handleKeyDown}>
      <form className="modal" ref={formRef} onSubmit={submit}>
        <h2>{editing ? 'Edit Barang' : 'Tambah Barang'}</h2>

        <label>Kode barang *</label>
        <input value={values.code} onChange={set('code')} autoFocus required />

        <label>Nama barang *</label>
        <input value={values.name} onChange={set('name')} required />

        <label>Kategori</label>
        <select value={values.categoryId} onChange={set('categoryId')}>
          <option value="">- tanpa kategori -</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label>Supplier</label>
        <select value={values.supplierId} onChange={set('supplierId')}>
          <option value="">- tanpa supplier -</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <label>Satuan</label>
        <input value={values.unit} onChange={set('unit')} required />

        <label>Harga beli *</label>
        <input type="number" min="0" step="any" value={values.buyPrice} onChange={set('buyPrice')} required />

        <label>Harga jual *</label>
        <input type="number" min="0" step="any" value={values.sellPrice} onChange={set('sellPrice')} required />
        <div className="hint">Laba: {marginPct}%</div>

        <label>Stok minimal</label>
        <input type="number" min="0" step="any" value={values.minStock} onChange={set('minStock')} />

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>Batal (Esc)</button>
          <button className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan (F4)'}
          </button>
        </div>
      </form>
    </div>
  );
}