import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Order } from '../../types';
import { useStore } from '../../store';
import { Check, X, Clock, Download, FileText, Search, Activity, CheckCircle2, AlertTriangle, Package, Calendar, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sortOption, setSortOption] = useState<string>('oldest_first');
  const [statusFilters, setStatusFilters] = useState<string[]>(['Pending']);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { token } = useStore();

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const getSortedOrders = (data: Order[], option: string) => {
    const list = [...data];
    switch (option) {
      case 'oldest_first':
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'newest_first':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'highest_value':
        return list.sort((a, b) => b.totalAmount - a.totalAmount);
      case 'lowest_value':
        return list.sort((a, b) => a.totalAmount - b.totalAmount);
      case 'pending_first':
        return list.sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      case 'most_items':
        return list.sort((a, b) => {
          const aItems = (a.items || []).reduce((sum, item) => sum + item.quantity, 0);
          const bItems = (b.items || []).reduce((sum, item) => sum + item.quantity, 0);
          return bItems - aItems;
        });
      default:
        return list;
    }
  };

  const fetchOrders = async () => {
    const data = await api.get('/orders', token);
    setOrders(data);
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(o.status);
    if (!matchesStatus) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesId = (o.id || '').toLowerCase().includes(term);
    const matchesPhone = (o.deliveryDetails?.phone || '').toLowerCase().includes(term);
    const matchesName = (o.deliveryDetails?.fullName || '').toLowerCase().includes(term);

    return matchesId || matchesPhone || matchesName;
  });
  const sortedOrders = getSortedOrders(filteredOrders, sortOption);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status }, token);
      fetchOrders();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      await api.put(`/orders/${id}/paymentStatus`, { paymentStatus }, token);
      fetchOrders();
    } catch (e) {
      alert("Failed to update payment status");
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const executeDeleteOrder = async (id: string) => {
    try {
      await api.delete(`/orders/${id}`, token);
      fetchOrders();
      setDeleteConfirmId(null);
    } catch (e) {
      console.error("Failed to delete order", e);
    }
  };

  const exportToCSV = () => {
    if (sortedOrders.length === 0) return;
    
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Status', 'Payment Method', 'Payment Status', 'TrxID', 'Total Amount', 'Items Count'];
    
    const rows = sortedOrders.map(order => [
      order.id,
      `"${new Date(order.createdAt).toLocaleString().replace(/"/g, '""')}"`,
      `"${(order.deliveryDetails?.fullName || '').replace(/"/g, '""')}"`,
      `"${(order.deliveryDetails?.phone || '').replace(/"/g, '""')}"`,
      `"${(order.deliveryDetails?.address || '').replace(/"/g, '""')}"`,
      order.status,
      order.paymentMethod || 'Cash on Delivery',
      order.paymentStatus || 'Pending',
      order.transactionId || 'N/A',
      Number(order.totalAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      (order.items || []).reduce((sum, item) => sum + item.quantity, 0).toString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (sortedOrders.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Admin Orders Invoice Summary', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const headers = [['Order ID', 'Date', 'Customer Name', 'Status', 'Payment', 'Total Amount', 'Items Count']];
    const data = sortedOrders.map(order => [
      order.id.slice(0, 8) + '...',
      new Date(order.createdAt).toLocaleDateString(),
      order.deliveryDetails?.fullName || 'N/A',
      order.status,
      order.paymentStatus || 'Pending',
      `$${Number(order.totalAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      (order.items || []).reduce((sum, item) => sum + item.quantity, 0).toString()
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 3 },
    });
    
    doc.save(`orders_invoice_summary_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const statPending = orders.filter(o => o.status === 'Pending').length;
  const statAccepted = orders.filter(o => o.status === 'Accepted').length;
  const statShipped = orders.filter(o => o.status === 'Shipped').length;
  const statDelivered = orders.filter(o => o.status === 'Delivered').length;
  const statCancelled = orders.filter(o => o.status === 'Cancelled').length;
  const statTotal = orders.length;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Orders</h2>
          <p className="text-xs text-slate-500 mt-1">Track payments, update shipping, and download general lists</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={sortedOrders.length === 0}
            className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={sortedOrders.length === 0}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export to PDF
          </button>
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <label htmlFor="sort-orders" className="text-sm font-medium text-slate-600 px-2">Sort by:</label>
            <select
              id="sort-orders"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border-none bg-white rounded-md py-1.5 px-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="oldest_first">Oldest First</option>
              <option value="newest_first">Newest First</option>
              <option value="highest_value">Highest Value</option>
              <option value="lowest_value">Lowest Value</option>
              <option value="pending_first">Action Required (Pending First)</option>
              <option value="most_items">Largest Orders (Most Items)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick View Stats segment */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <button 
          onClick={() => setStatusFilters(['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'])}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all h-full flex flex-col justify-between ${
            statusFilters.length === 5 
              ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10' 
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider font-mono opacity-90">Total Orders</span>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black font-mono leading-none">{statTotal}</div>
            <div className="text-xs mt-1 opacity-80 font-medium whitespace-nowrap overflow-hidden text-ellipsis">All recorded orders</div>
          </div>
        </button>

        <button 
          onClick={() => setStatusFilters(['Pending'])}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all h-full flex flex-col justify-between ${
            statusFilters.length === 1 && statusFilters[0] === 'Pending'
              ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/15' 
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider font-mono opacity-90">Pending</span>
              <Clock className={`w-4 h-4 ${statusFilters.length === 1 && statusFilters[0] === 'Pending' ? 'text-white' : 'text-amber-550'}`} />
            </div>
            <div className="text-2xl font-black font-mono leading-none">{statPending}</div>
            <div className="text-xs mt-1 opacity-80 font-medium font-sans whitespace-nowrap overflow-hidden text-ellipsis">Awaiting trigger</div>
          </div>
        </button>

        <button 
          onClick={() => setStatusFilters(['Accepted'])}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all h-full flex flex-col justify-between ${
            statusFilters.length === 1 && statusFilters[0] === 'Accepted'
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/15' 
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider font-mono opacity-90">Accepted</span>
              <CheckCircle2 className={`w-4 h-4 ${statusFilters.length === 1 && statusFilters[0] === 'Accepted' ? 'text-white' : 'text-blue-500'}`} />
            </div>
            <div className="text-2xl font-black font-mono leading-none">{statAccepted}</div>
            <div className="text-xs mt-1 opacity-80 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Prepping and ready</div>
          </div>
        </button>

        <button 
          onClick={() => setStatusFilters(['Shipped'])}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all h-full flex flex-col justify-between ${
            statusFilters.length === 1 && statusFilters[0] === 'Shipped'
              ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/15' 
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider font-mono opacity-90">Shipped</span>
              <Package className={`w-4 h-4 ${statusFilters.length === 1 && statusFilters[0] === 'Shipped' ? 'text-white' : 'text-violet-550'}`} />
            </div>
            <div className="text-2xl font-black font-mono leading-none">{statShipped}</div>
            <div className="text-xs mt-1 opacity-80 font-medium whitespace-nowrap overflow-hidden text-ellipsis">In package/transit</div>
          </div>
        </button>

        <button 
          onClick={() => setStatusFilters(['Delivered'])}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all h-full flex flex-col justify-between ${
            statusFilters.length === 1 && statusFilters[0] === 'Delivered'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/15' 
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider font-mono opacity-90">Delivered</span>
              <Check className={`w-4 h-4 ${statusFilters.length === 1 && statusFilters[0] === 'Delivered' ? 'text-white' : 'text-emerald-555'}`} />
            </div>
            <div className="text-2xl font-black font-mono leading-none">{statDelivered}</div>
            <div className="text-xs mt-1 opacity-80 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Receipt complete</div>
          </div>
        </button>
      </div>

      {/* Dynamic Search Bar Component */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search orders by Order ID, Phone number, or Customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-sm font-medium text-slate-800"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <span className="text-sm font-bold text-slate-700 mr-2">Filter by Status:</span>
        {['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'].map(status => {
          const isActive = statusFilters.includes(status);
          let activeColor = 'bg-indigo-600 border-indigo-600 text-white shadow-sm';
          if (isActive) {
            if (status === 'Pending') activeColor = 'bg-amber-500 border-amber-500 text-white shadow-sm';
            if (status === 'Accepted') activeColor = 'bg-blue-500 border-blue-500 text-white shadow-sm';
            if (status === 'Shipped') activeColor = 'bg-violet-500 border-violet-500 text-white shadow-sm';
            if (status === 'Delivered') activeColor = 'bg-emerald-500 border-emerald-500 text-white shadow-sm';
            if (status === 'Cancelled') activeColor = 'bg-rose-500 border-rose-500 text-white shadow-sm';
          }
          return (
            <button
              key={status}
              onClick={() => {
                if (isActive) {
                  setStatusFilters(statusFilters.filter(s => s !== status));
                } else {
                  setStatusFilters([...statusFilters, status]);
                }
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                isActive
                  ? activeColor
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          );
        })}
        {statusFilters.length < 5 && (
          <button
            onClick={() => setStatusFilters(['Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'])}
            className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors ml-auto underline"
          >
            Select All
          </button>
        )}
      </div>

      {sortedOrders.length === 0 ? (
        <p className="text-slate-500 text-center py-8 bg-white rounded-lg border border-slate-200">No orders found.</p>
      ) : (
        <div className="space-y-6">
          {sortedOrders.map(order => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between mb-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Order #{order.id}</h3>
                  <div className="mt-1.5 text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50 w-max">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className="text-slate-300">|</span>
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-4">
                  <span className="font-bold text-xl text-slate-700">৳{Number(order.totalAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className={`border rounded-lg px-4 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors cursor-pointer ${
                      order.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      order.status === 'Accepted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      order.status === 'Shipped' ? 'bg-violet-100 text-violet-800 border-violet-200' :
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {deleteConfirmId === order.id ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => executeDeleteOrder(order.id)}
                        className="p-1.5 text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors font-bold text-xs px-3 shadow-sm"
                      >
                        Confirm Delete
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-semibold text-xs px-3 shadow-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeleteConfirmId(order.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 shadow-sm hover:shadow-md"
                      title="Delete Order"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Customer Details</h4>
                    <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-1">
                      <p><span className="font-medium text-slate-900">Name:</span> {order.deliveryDetails?.fullName || 'N/A'}</p>
                      <p><span className="font-medium text-slate-900">Phone:</span> {order.deliveryDetails?.phone || 'N/A'}</p>
                      <p><span className="font-medium text-slate-900">Address:</span> {order.deliveryDetails?.address || 'N/A'}</p>
                      {order.deliveryDetails?.instructions && (
                        <div className="pt-2 mt-2 border-t border-slate-200/60">
                          <p><span className="font-medium text-slate-900 block mb-1">Instructions:</span> 
                            <span className="text-slate-600 block bg-slate-100 p-2 rounded italic">{order.deliveryDetails.instructions}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Payment Info</h4>
                    <div className={`p-4 rounded-lg border text-sm space-y-2 ${order.paymentMethod === 'Manual Payment' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                      <p><span className="font-medium text-slate-900">Method:</span> <span className="font-semibold text-indigo-600">{order.paymentMethod || 'Cash on Delivery'}</span></p>
                      
                      {order.paymentMethod === 'Manual Payment' && (
                        <>
                          <p><span className="font-medium text-slate-900">TrxID:</span> <span className="font-mono bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-900">{order.transactionId || 'N/A'}</span></p>
                          
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-orange-200/50">
                            <span className="font-medium text-slate-900 flex items-center">
                              Status: 
                              {order.paymentStatus === 'Verified' && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center"><Check className="w-3 h-3 mr-1" /> Verified</span>}
                              {order.paymentStatus === 'Failed' && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700 flex items-center"><X className="w-3 h-3 mr-1" /> Failed</span>}
                              {(!order.paymentStatus || order.paymentStatus === 'Pending') && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 flex items-center"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                            </span>
                            
                            <div className="flex gap-2">
                              {order.paymentStatus !== 'Verified' && (
                                <button 
                                  onClick={() => updatePaymentStatus(order.id, 'Verified')}
                                  className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
                                >
                                  Verify
                                </button>
                              )}
                              {order.paymentStatus !== 'Failed' && (
                                <button 
                                  onClick={() => updatePaymentStatus(order.id, 'Failed')}
                                  className="text-xs font-semibold px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-500 transition-colors"
                                >
                                  Fail
                                </button>
                              )}
                              {order.paymentStatus !== 'Pending' && (
                                <button 
                                  onClick={() => updatePaymentStatus(order.id, 'Pending')}
                                  className="text-xs font-semibold px-3 py-1.5 border border-slate-300 text-slate-600 bg-white rounded hover:bg-slate-50 transition-colors"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Items</h4>
                  <ul className="text-sm space-y-2 border border-slate-200 rounded-lg p-4 bg-slate-50">
                    {order.items.map(item => (
                      <li key={item.productId} className="flex justify-between border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                        <span className="text-slate-700 line-clamp-1 flex-1 pr-4 font-medium">{item.quantity}x {item.title}</span>
                        <span className="font-bold text-slate-900">৳{Number((item.price * item.quantity) || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </li>
                    ))}
                  </ul>
                  {order.discountAmount ? (
                    <div className="mt-4 flex justify-between items-center text-sm px-4">
                      <span className="text-slate-500">Discount Added</span>
                      <span className="text-emerald-600 font-bold">-৳{Number(order.discountAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
