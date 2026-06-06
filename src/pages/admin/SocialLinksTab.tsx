import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { SocialLink } from '../../types';
import { Plus, Edit2, Trash2, Loader2, Link as LinkIcon, CheckCircle, XCircle } from 'lucide-react';

export default function SocialLinksTab() {
  const { token } = useStore();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLink, setCurrentLink] = useState<Partial<SocialLink>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadLinks();
    const intervalId = setInterval(() => {
      loadLinks();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [token]);

  const loadLinks = async () => {
    try {
      const data = await api.get('/social-links', token);
      setLinks(data || []);
    } catch (e) {
      console.error('Failed to load social links');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLink.name || !currentLink.url) return;

    try {
      if (currentLink.id) {
        const updated = await api.put(`/social-links/${currentLink.id}`, currentLink, token);
        setLinks(links.map(l => l.id === updated.id ? updated : l));
      } else {
        const added = await api.post('/social-links', currentLink, token);
        setLinks([...links, added]);
      }
      setIsEditing(false);
      setCurrentLink({});
    } catch (err) {
      console.error(err);
      alert('Failed to save social link');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/social-links/${id}`, token);
      setLinks(links.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Social Links</h2>
        <button 
          onClick={() => { setIsEditing(true); setCurrentLink({}); }} 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-5 h-5 mr-1" /> Add Link
        </button>
      </div>

      {isEditing && (
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg mb-8 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">{currentLink.id ? 'Edit Link' : 'New Link'}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1 text-slate-700">Platform Name</label>
              <input 
                autoFocus 
                required 
                type="text" 
                value={currentLink.name || ''} 
                onChange={e => setCurrentLink({...currentLink, name: e.target.value})} 
                className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="e.g. Facebook, Instagram"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1 text-slate-700">URL</label>
              <input 
                required 
                type="url" 
                value={currentLink.url || ''} 
                onChange={e => setCurrentLink({...currentLink, url: e.target.value})} 
                className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="https://"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Cancel</button>
              <button type="submit" className="bg-slate-900 border border-slate-900 text-white px-6 py-2 rounded shadow hover:bg-slate-800 font-medium transition-colors">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {links.length === 0 && !isEditing && (
             <li className="p-8 text-center text-slate-500">No social links added yet.</li>
          )}
          {links.map(link => (
            <li key={link.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{link.name}</h4>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline">
                    {link.url}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => { setCurrentLink(link); setIsEditing(true); }} 
                  disabled={deletingId === link.id}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(link.id)} 
                  disabled={deletingId === link.id}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === link.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
