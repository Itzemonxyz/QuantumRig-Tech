import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Offer } from '../../types';

export default function OffersTab() {
  const { offers, setOffers, token } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Partial<Offer>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      const data = await api.get('/offers', token);
      setOffers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOffers();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [token]);

  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentOffer.id) {
        const updated = await api.put(`/offers/${currentOffer.id}`, currentOffer);
        setOffers(offers.map(o => o.id === updated.id ? updated : o));
      } else {
        const newOffer = await api.post('/offers', currentOffer);
        setOffers([...offers, newOffer]);
      }
      setIsEditing(false);
      setCurrentOffer({});
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/offers/${id}`);
      setOffers(offers.filter(o => o.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isEditing) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{currentOffer.id ? 'Edit Offer' : 'Add New Offer'}</h2>
        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input 
              required
              type="text"
              value={currentOffer.title || ''}
              onChange={e => setCurrentOffer({...currentOffer, title: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input 
              required
              type="text"
              value={currentOffer.imageUrl || ''}
              onChange={e => setCurrentOffer({...currentOffer, imageUrl: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea 
              value={currentOffer.description || ''}
              onChange={e => setCurrentOffer({...currentOffer, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={currentOffer.active !== false}
              onChange={(e) => setCurrentOffer({...currentOffer, active: e.target.checked})}
              className="mr-2"
            />
            <label className="text-sm font-medium text-slate-700">Active</label>
          </div>
          <div className="flex space-x-4 pt-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Save</button>
            <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-200 text-slate-800 px-4 py-2 rounded hover:bg-slate-300">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Manage Offers</h2>
        <button 
          onClick={() => { setCurrentOffer({active: true}); setIsEditing(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded font-medium flex items-center hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Offer
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500">
              <th className="pb-3 font-medium">Image</th>
              <th className="pb-3 font-medium">Title</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {offers.map(offer => (
              <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3">
                  {offer.imageUrl && <img src={offer.imageUrl} alt={offer.title} className="w-12 h-12 object-contain bg-white rounded border border-slate-200" />}
                </td>
                <td className="py-3 font-medium text-slate-900">
                  {offer.title}
                  {offer.description && <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{offer.description}</p>}
                </td>
                <td className="py-3">
                  {offer.active ? <span className="text-emerald-600 flex items-center text-sm font-medium"><CheckCircle className="w-4 h-4 mr-1"/> Active</span> :
                                  <span className="text-rose-600 flex items-center text-sm font-medium"><XCircle className="w-4 h-4 mr-1"/> Inactive</span>}
                </td>
                <td className="py-3 text-right">
                  <button onClick={() => { setCurrentOffer(offer); setIsEditing(true); }} disabled={deletingId === offer.id} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors mx-1 disabled:opacity-50">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(offer.id)} disabled={deletingId === offer.id} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors mx-1 disabled:opacity-50">
                    {deletingId === offer.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">No offers found. Add one above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
