import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useStore } from '../../store';
import { SupportTicket } from '../../types';
import { Trash2, Loader2, ClipboardList, LifeBuoy } from 'lucide-react';

interface Complaint {
  id: string;
  name: string;
  email: string;
  orderId?: string;
  category: string;
  description: string;
  createdAt: string;
}

export default function SupportTab() {
  const { token } = useStore();
  const [subTab, setSubTab] = useState<'tickets' | 'complaints'>('tickets');
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [deletingComplaintId, setDeletingComplaintId] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
    loadComplaints();
    const intervalId = setInterval(() => {
      loadTickets();
      loadComplaints();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const loadTickets = async () => {
    try {
      const data = await api.get('/support-tickets', token);
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadComplaints = async () => {
    try {
      const data = await api.get('/complaints', token);
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Open' | 'Closed') => {
    try {
      await api.put(`/support-tickets/${id}`, { status }, token);
      loadTickets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/support-tickets/${id}`, token);
      loadTickets();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    setDeletingComplaintId(id);
    try {
      await api.delete(`/complaints/${id}`, token);
      loadComplaints();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingComplaintId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Issues & Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Manage support tickets and official customer complaints.</p>
        </div>
      </div>

      {/* Sub tabs selection */}
      <div className="flex space-x-6 border-b border-slate-200 mb-6">
        <button
          onClick={() => setSubTab('tickets')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
            subTab === 'tickets' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'text-slate-500 hover:text-slate-900 border-transparent'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          Support Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setSubTab('complaints')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
            subTab === 'complaints' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'text-slate-500 hover:text-slate-900 border-transparent'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Customer Complaints ({complaints.length})
        </button>
      </div>

      {subTab === 'tickets' ? (
        loadingTickets ? (
          <div className="p-4 text-slate-500">Loading tickets...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-tight text-xs">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Question</th>
                    <th className="px-6 py-4">Product ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                        No support tickets found.
                      </td>
                    </tr>
                  ) : tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{ticket.id}</td>
                      <td className="px-6 py-4 font-medium">{ticket.email}</td>
                      <td className="px-6 py-4 max-w-xs"><div className="truncate" title={ticket.question}>{ticket.question}</div></td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{ticket.productId}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          ticket.status === 'Open' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3 text-sm flex items-center justify-end">
                        {ticket.status === 'Open' ? (
                          <button 
                            onClick={() => handleUpdateStatus(ticket.id, 'Closed')}
                            className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            Close
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUpdateStatus(ticket.id, 'Open')}
                            className="font-bold text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                        <button onClick={() => handleDelete(ticket.id)} disabled={deletingId === ticket.id} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50">
                          {deletingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        loadingComplaints ? (
          <div className="p-4 text-slate-500">Loading complaints...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-tight text-xs">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-medium">
                        No customer complaints found.
                      </td>
                    </tr>
                  ) : complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{complaint.id.slice(0, 10)}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{complaint.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{complaint.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {complaint.orderId ? (
                          <span className="bg-slate-100 text-slate-800 font-mono text-xs px-2 py-1 rounded font-bold">
                            {complaint.orderId}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-100">
                          {complaint.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="whitespace-pre-line text-xs font-medium text-slate-700 leading-relaxed max-h-24 overflow-y-auto pr-2" title={complaint.description}>
                          {complaint.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteComplaint(complaint.id)} 
                          disabled={deletingComplaintId === complaint.id} 
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete Complaint"
                        >
                          {deletingComplaintId === complaint.id ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin"/>
                          ) : (
                            <Trash2 className="w-4.5 h-4.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
