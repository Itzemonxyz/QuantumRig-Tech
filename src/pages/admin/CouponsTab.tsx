import React, { useState, useEffect } from 'react';
import { Coupon, Product } from '../../types';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { Plus, Trash2, Edit2, Ticket, Loader2 } from 'lucide-react';

export default function CouponsTab() {
  const { token, products } = useStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Coupon>>({
    code: '', discountPercentage: 10, isActive: true, applicableProductIds: []
  });

  const fetchCoupons = async () => {
    try {
      const data = await api.get('/coupons');
      setCoupons(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    const intervalId = setInterval(() => {
      fetchCoupons();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNew = () => {
    setForm({ code: '', discountPercentage: 10, isActive: true, applicableProductIds: [] });
    setIsEditing(true);
  };

  const handleEdit = (c: Coupon) => {
    setForm(c);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/coupons/${id}`, token);
      fetchCoupons();
    } catch(e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.id) {
        await api.put(`/coupons/${form.id}`, form, token);
      } else {
        await api.post('/coupons', form, token);
      }
      setIsEditing(false);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    const ids = form.applicableProductIds || [];
    if (ids.includes(productId)) {
      setForm({ ...form, applicableProductIds: ids.filter(id => id !== productId) });
    } else {
      setForm({ ...form, applicableProductIds: [...ids, productId] });
    }
  };

  if (isEditing) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{form.id ? 'Edit Coupon' : 'New Coupon'}</h2>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Coupon Code</label>
              <input required type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full border rounded p-2" placeholder="e.g. SUMMER20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Percentage (%)</label>
              <input required type="number" min="0" max="100" value={form.discountPercentage || 0} onChange={e => setForm({...form, discountPercentage: parseInt(e.target.value)})} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="rounded" />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
            
            <div className="col-span-2 mt-4">
              <label className="block text-sm font-medium mb-2">Applicable Products (Leave empty for all products)</label>
              <div className="h-64 overflow-y-auto border border-slate-200 rounded p-4 space-y-2 bg-slate-50">
                {products.map(p => (
                  <label key={p.id} className="flex items-center space-x-3 bg-white p-2 rounded shadow-sm border border-slate-100 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(form.applicableProductIds || []).includes(p.id)}
                      onChange={() => toggleProductSelection(p.id)}
                      className="rounded"
                    />
                    <img src={p.imageUrl} alt={p.title} className="w-8 h-8 object-contain" />
                    <span className="text-sm text-slate-700 flex-1 truncate">{p.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center">
          <Ticket className="w-5 h-5 mr-2" />
          Coupons
        </h2>
        <button onClick={handleNew} className="flex items-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4 mr-1" />
          New Coupon
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Code</th>
              <th className="px-6 py-3 font-medium">Discount</th>
              <th className="px-6 py-3 font-medium">Applies To</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {coupons.map(c => (
              <tr key={c.id}>
                <td className="px-6 py-4 font-bold text-slate-900">{c.code}</td>
                <td className="px-6 py-4">{c.discountPercentage}%</td>
                <td className="px-6 py-4 text-slate-500">{c.applicableProductIds.length === 0 ? 'All Products' : `${c.applicableProductIds.length} Products`}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(c)} disabled={deletingId === c.id} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded mr-2 disabled:opacity-50"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded disabled:opacity-50">
                    {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No coupons found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
