import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { Settings } from '../../types';
import { Save } from 'lucide-react';

export default function SettingsTab() {
  const { settings, setSettings, token } = useStore();
  const [form, setForm] = useState<Settings>({
    announcementText: '', facebookUrl: '', whatsappUrl: '', instagramUrl: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put('/settings', form, token);
      setSettings(updated);
      alert('Settings saved!');
    } catch(err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Store Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-4">
          <h3 className="font-bold text-slate-900">Announcement Banner</h3>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Banner Text</label>
            <input type="text" value={form.announcementText} onChange={e => setForm({...form, announcementText: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Free shipping..." />
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg shadow font-medium flex items-center hover:bg-indigo-500 transition-colors disabled:opacity-70">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
