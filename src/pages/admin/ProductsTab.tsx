import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { Product } from '../../types';
import { ArrowUpDown, Plus, Edit2, Trash2, X, PackagePlus, Copy, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function ProductsTab() {
  const location = useLocation();
  const { products, categories, brands, setProducts, token } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({
    title: '', slug: '', categoryId: '', price: 0, stockStatus: 'In Stock', imageUrl: '', description: '', specs: {}, socket: '', wattage: 0, inventoryCount: 0
  });
  const [specsText, setSpecsText] = useState('');
  const [additionalImagesText, setAdditionalImagesText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const queryParams = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStockAction, setBulkStockAction] = useState('');
  const [bulkPriceValue, setBulkPriceValue] = useState<number | ''>('');
  const [sortField, setSortField] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchSearch = async () => {
      try {
        if (!searchQuery.trim()) {
           setSearchedProducts(products);
           return;
        }
        const results = await api.get(`/admin/products/search?q=${encodeURIComponent(searchQuery)}`, token);
        setSearchedProducts(results);
      } catch (err) {
        console.error(err);
      }
    };
    
    // Simple debounce
    const timer = setTimeout(() => {
      fetchSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, products, token]);

  const sortedProducts = [...searchedProducts].sort((a, b) => {
    if (sortField === 'stock') {
      const aStock = a.inventoryCount || 0;
      const bStock = b.inventoryCount || 0;
      return sortAsc ? aStock - bStock : bStock - aStock;
    }
    return 0;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdateStock = async () => {
    if (!bulkStockAction || selectedIds.length === 0) return;
    setLoading(true);
    for (const id of selectedIds) {
      const p = products.find(p => p.id === id);
      if (p) {
        await api.put(`/products/${id}`, { ...p, stockStatus: bulkStockAction }, token);
      }
    }
    const updated = await api.get('/products');
    setProducts(updated);
    setSelectedIds([]);
    setBulkStockAction('');
    setLoading(false);
  };

  const handleBulkUpdatePrice = async () => {
    if (bulkPriceValue === '' || selectedIds.length === 0) return;
    setLoading(true);
    for (const id of selectedIds) {
      const p = products.find(p => p.id === id);
      if (p) {
        await api.put(`/products/${id}`, { ...p, price: Number(bulkPriceValue) }, token);
      }
    }
    const updated = await api.get('/products');
    setProducts(updated);
    setSelectedIds([]);
    setBulkPriceValue('');
    setLoading(false);
  };

  const handleClone = (p: Product) => {
    const { id, code, ...rest } = p;
    let newCode = code || '';
    if (newCode) newCode = `${newCode}-CLONE`;
    
    setForm({ ...rest, title: `${rest.title} (Clone)`, code: newCode });
    setSpecsText(Object.entries(p.specs || {}).map(([k, v]) => `${k}:${v}`).join('\n'));
    setAdditionalImagesText(p.additionalImages?.join('\n') || '');
    setIsEditing(true);
  };

  const handleEdit = (p: Product) => {
    setForm(p);
    setSpecsText(Object.entries(p.specs || {}).map(([k, v]) => `${k}:${v}`).join('\n'));
    setAdditionalImagesText(p.additionalImages?.join('\n') || '');
    setIsEditing(true);
  };

  const handleNew = () => {
    setForm({ title: '', slug: '', categoryId: categories[0]?.id || '', price: 0, stockStatus: 'In Stock', imageUrl: '', description: '', specs: {}, socket: '', wattage: 0, inventoryCount: 0 });
    setSpecsText('');
    setAdditionalImagesText('');
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`, token);
      const updated = await api.get('/products');
      setProducts(updated);
    } catch (e) {
      console.error(e);
      alert('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickRestock = async (p: Product) => {
    try {
      const payload = {
        ...p,
        inventoryCount: (p.inventoryCount || 0) + 10,
        stockStatus: 'In Stock'
      };
      await api.put(`/products/${p.id}`, payload, token);
      const updated = await api.get('/products');
      setProducts(updated);
    } catch (e) {
      alert('Failed to restock product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (form.discountPrice && form.price && form.discountPrice > form.price) {
      alert("Offer Price cannot be higher than Regular Price.");
      setLoading(false);
      return;
    }
    
    // Parse specs
    const specs: Record<string, string> = {};
    specsText.split('\n').forEach(line => {
      const [k, v] = line.split(':');
      if (k && v) specs[k.trim()] = v.trim();
    });

    const additionalImages: string[] = additionalImagesText.split('\n').map(l => l.trim()).filter(l => l);

    const payload = { ...form, specs, additionalImages };

    try {
      if (form.id) {
        await api.put(`/products/${form.id}`, payload, token);
      } else {
        await api.post('/products', payload, token);
      }
      const updated = await api.get('/products');
      setProducts(updated);
      setIsEditing(false);
    } catch (e) {
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-slate-800">{form.id ? 'Edit Product' : 'New Product'}</h2>
           <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Code</label>
              <input type="text" value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} className="w-full sm:w-2/3 border rounded p-2 text-sm font-mono" placeholder="Leave empty to auto-generate (e.g. 39614)" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <select value={form.brand || ''} onChange={e => setForm({...form, brand: e.target.value})} className="w-full border rounded p-2">
                 <option value="">Select a Brand (Optional)</option>
                 {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full border rounded p-2">
                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Regular Price</label>
              <input required type="number" step="0.01" value={form.price === undefined || isNaN(form.price) ? '' : form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Offer Price (Optional)</label>
              <input type="number" step="0.01" value={form.discountPrice === undefined || isNaN(form.discountPrice) ? '' : form.discountPrice} onChange={e => setForm({...form, discountPrice: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Status</label>
              <select value={form.stockStatus} onChange={e => setForm({...form, stockStatus: e.target.value as any})} className="w-full border rounded p-2">
                 <option value="In Stock">In Stock</option>
                 <option value="Out of Stock">Out of Stock</option>
                 <option value="Discontinued">Discontinued</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inventory Count</label>
              <input required type="number" min="0" value={form.inventoryCount === undefined || isNaN(form.inventoryCount) ? '' : form.inventoryCount} onChange={e => setForm({...form, inventoryCount: parseInt(e.target.value)})} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input required type="url" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Additional Images (One URL per line)</label>
              <textarea value={additionalImagesText} onChange={e => setAdditionalImagesText(e.target.value)} className="w-full border rounded p-2 font-mono text-sm" rows={2} placeholder="https://example.com/img2.jpg&#10;https://example.com/img3.jpg"></textarea>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded p-2" rows={3}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Socket (Optional)</label>
              <input type="text" value={form.socket || ''} onChange={e => setForm({...form, socket: e.target.value})} className="w-full border rounded p-2" />
            </div>
             <div>
              <label className="block text-sm font-medium mb-1">Wattage (Optional)</label>
              <input type="number" value={form.wattage === undefined || isNaN(form.wattage) ? '' : form.wattage} onChange={e => setForm({...form, wattage: parseInt(e.target.value)})} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Specs (Format: Key:Value per line)</label>
              <textarea value={specsText} onChange={e => setSpecsText(e.target.value)} className="w-full border rounded p-2 font-mono text-sm" rows={4} placeholder="Cores: 24&#10;Threads: 32"></textarea>
            </div>
          </div>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded shadow">Save Product</button>
        </form>
      </div>
    );
  }

  const handleDownloadCSV = () => {
    const headers = ['Title', 'Price', 'Stock Count'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => `"${p.title.replace(/"/g, '""')}",${Number(p.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})},${p.inventoryCount || 0}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex-shrink-0">Products</h2>
        
        <div className="flex-1 w-full md:max-w-md">
          <input 
            type="text" 
            placeholder="Search by product code or title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleDownloadCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow hover:bg-emerald-500 transition-colors whitespace-nowrap">
            Download CSV
          </button>
          <button onClick={handleNew} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow hover:bg-indigo-500 transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4 mr-1"/> Add Product
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-indigo-800">
            {selectedIds.length} product(s) selected
          </span>
          <div className="flex items-center gap-2">
            <select 
              value={bulkStockAction} 
              onChange={e => setBulkStockAction(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Update Stock Status...</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
            <button 
              onClick={handleBulkUpdateStock}
              disabled={loading || !bulkStockAction}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Apply Status
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="New Bulk Price" 
              value={bulkPriceValue}
              onChange={e => setBulkPriceValue(e.target.value ? Number(e.target.value) : '')}
              className="border border-slate-300 rounded px-2 py-1.5 text-sm w-32"
            />
            <button 
              onClick={handleBulkUpdatePrice}
              disabled={loading || bulkPriceValue === ''}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Apply Price
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-3 w-10">
                <input 
                  type="checkbox" 
                  checked={searchedProducts.length > 0 && selectedIds.length === searchedProducts.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th 
                className="px-6 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group" 
                onClick={() => { setSortField('stock'); setSortAsc(prev => !prev); }}
              >
                <div className="flex items-center gap-1">
                  Status/Stock
                  <ArrowUpDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                </div>
              </th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedProducts.map(p => (
              <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(p.id) ? 'bg-indigo-50/50 hover:bg-indigo-50/70' : ''}`}>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(p.id)}
                    onChange={() => handleSelectProduct(p.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 flex items-center">
                  <img src={p.imageUrl} alt="" className="w-10 h-10 object-contain bg-white border border-slate-100 rounded mr-3" />
                  <div>
                    <span className="font-medium text-slate-900 line-clamp-1">{p.title}</span>
                    <span className="text-xs text-slate-500 block mt-0.5">Product Code: <strong className="font-semibold text-slate-700">{p.code || 'N/A'}</strong></span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{categories.find(c => c.id === p.categoryId)?.name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">${Number(p.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    {p.discountPrice && (
                      <span className={`text-xs mt-0.5 ${p.discountPrice > p.price ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-emerald-600 font-medium'}`} title={p.discountPrice > p.price ? "Offer price is higher than regular price!" : ""}>
                        ${Number(p.discountPrice || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})} (Offer)
                        {p.discountPrice > p.price && <AlertCircle className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <motion.div 
                    key={p.inventoryCount}
                    initial={{ scale: 1.2, backgroundColor: '#fcd34d' }}
                    animate={{ scale: 1, backgroundColor: 'transparent' }}
                    transition={{ duration: 0.5 }}
                    className="inline-block rounded"
                  >
                    {p.stockStatus === 'Out of Stock' || p.inventoryCount === 0 ? (
                      <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                        Out of Stock
                      </span>
                    ) : p.inventoryCount !== undefined && p.inventoryCount < 5 ? (
                      <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Low Stock ({p.inventoryCount})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        {p.stockStatus} ({p.inventoryCount})
                      </span>
                    )}
                  </motion.div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button onClick={() => handleQuickRestock(p)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded mr-2" title="Quick Restock (+10)"><PackagePlus className="w-4 h-4"/></button>
                  <button onClick={() => handleClone(p)} title="Clone Product" className="text-blue-600 hover:bg-blue-50 p-1.5 rounded mr-2"><Copy className="w-4 h-4"/></button>
                  <button onClick={() => handleEdit(p)} title="Edit" className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded mr-2"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} title="Delete" className="text-rose-600 hover:bg-rose-50 p-1.5 rounded disabled:opacity-50">
                    {deletingId === p.id ? <div className="w-4 h-4 rounded-full border-2 border-rose-600 border-t-transparent animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
