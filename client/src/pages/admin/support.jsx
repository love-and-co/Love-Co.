import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Headphones,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Mail,
  Phone,
  Package,
  Send,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Sparkles,
  Inbox
} from 'lucide-react';
import AdminLayout from '../../modules/admin/components/AdminLayout';
import { INITIAL_SUPPORT_TICKETS, SUPPORT_STORAGE_KEY } from '../../modules/admin/data/mockSupportTickets';

export default function AdminCustomerSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, IN_PROGRESS, RESOLVED
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Load tickets from localStorage or mock seed
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SUPPORT_STORAGE_KEY);
      if (stored && stored.trim() && stored !== 'undefined' && stored !== 'null') {
        const parsed = JSON.parse(stored);
        setTickets(Array.isArray(parsed) ? parsed : INITIAL_SUPPORT_TICKETS);
        if (Array.isArray(parsed) && parsed.length > 0) setSelectedTicketId(parsed[0].id);
      } else {
        setTickets(INITIAL_SUPPORT_TICKETS);
        if (INITIAL_SUPPORT_TICKETS.length > 0) setSelectedTicketId(INITIAL_SUPPORT_TICKETS[0].id);
        localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(INITIAL_SUPPORT_TICKETS));
      }
    } catch (e) {
      setTickets(INITIAL_SUPPORT_TICKETS);
      if (INITIAL_SUPPORT_TICKETS.length > 0) setSelectedTicketId(INITIAL_SUPPORT_TICKETS[0].id);
    }
  }, []);

  const saveTickets = (updatedList) => {
    setTickets(updatedList);
    try {
      localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      // ignore
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // KPI Counts
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = t.customerName?.toLowerCase().includes(q);
        const matchEmail = t.customerEmail?.toLowerCase().includes(q);
        const matchSubject = t.subject?.toLowerCase().includes(q);
        const matchOrder = t.orderId?.toLowerCase().includes(q);
        const matchId = t.id?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchSubject && !matchOrder && !matchId) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchTerm]);

  // Active selected ticket
  const activeTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;
  }, [tickets, selectedTicketId, filteredTickets]);

  // Update Status
  const handleUpdateStatus = (id, newStatus) => {
    const updated = tickets.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
    saveTickets(updated);
    showToast(`Ticket ${id} marked as ${newStatus.replace('_', ' ')}.`);
  };

  // Send Reply
  const handleSendReply = (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const newReply = {
      id: `rep-${Date.now()}`,
      sender: 'Admin Support',
      time: new Date().toISOString(),
      text: replyText.trim()
    };

    const updated = tickets.map((t) => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status,
          replies: [...(t.replies || []), newReply]
        };
      }
      return t;
    });

    saveTickets(updated);
    setReplyText('');
    showToast('Reply dispatched to customer email & portal log.');
  };

  // Delete Ticket
  const handleDeleteTicket = (id) => {
    if (!window.confirm(`Are you sure you want to remove ticket ${id}?`)) return;
    const updated = tickets.filter((t) => t.id !== id);
    saveTickets(updated);
    if (selectedTicketId === id) {
      setSelectedTicketId(updated[0]?.id || null);
    }
    showToast(`Ticket ${id} removed.`);
  };

  // Fast resolution templates
  const applyTemplate = (text) => {
    setReplyText(text);
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">HIGH URGENCY</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-100 text-amber-800 border border-amber-200">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-gray-600 bg-gray-100 border border-gray-200">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-300">OPEN</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-300">IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">RESOLVED</span>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout activeTab="Customer Support">
      <Head>
        <title>Customer Support &amp; Care Desk | Love &amp; Co. Admin</title>
      </Head>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1614] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E3EE]">
        <div>
          <div className="flex items-center space-x-2">
            <Headphones className="w-5 h-5 text-[#6F4E37]" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1614] tracking-tight">
              Customer Support &amp; Care Desk
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time customer inquiries, dispatch issues, formulation questions, and resolution logging.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/contact"
            target="_blank"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
            <span>Open Customer Form</span>
          </Link>
          <button
            onClick={() => {
              saveTickets(INITIAL_SUPPORT_TICKETS);
              showToast('Reset sample customer care tickets.');
            }}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Reload Default Inquiries"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E8E3EE] rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-mono uppercase text-gray-500">Total Inquiries</div>
          <div className="text-2xl font-serif font-bold text-[#1C1614] mt-1">{totalCount}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">All logged conversations</div>
        </div>

        <div className="bg-white border border-[#E8E3EE] rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-mono uppercase text-rose-700 font-bold">Action Required</div>
          <div className="text-2xl font-serif font-bold text-rose-700 mt-1">{openCount}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Open &amp; awaiting response</div>
        </div>

        <div className="bg-white border border-[#E8E3EE] rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-mono uppercase text-amber-700 font-semibold">In Progress</div>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Actively under investigation</div>
        </div>

        <div className="bg-white border border-[#E8E3EE] rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-mono uppercase text-emerald-700 font-semibold">Resolved</div>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">{resolvedCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Successfully closed</div>
        </div>
      </div>

      {/* Search and Filter Toolbar */}
      <div className="bg-white border border-[#E8E3EE] rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer, email, subject, order #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8] text-gray-700 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="Order & Delivery">Order &amp; Delivery</option>
              <option value="Product Formulation">Product Formulation</option>
              <option value="Address Correction">Address Correction</option>
              <option value="Refund & Return">Refund &amp; Return</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="sm:col-span-4 flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1 rounded-md text-[11px] transition ${
                statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-2xs font-semibold' : 'text-gray-500'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`flex-1 py-1 rounded-md text-[11px] transition ${
                statusFilter === 'OPEN' ? 'bg-rose-100 text-rose-900 shadow-2xs font-bold' : 'text-gray-500'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`flex-1 py-1 rounded-md text-[11px] transition ${
                statusFilter === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-900 shadow-2xs font-semibold' : 'text-gray-500'
              }`}
            >
              Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`flex-1 py-1 rounded-md text-[11px] transition ${
                statusFilter === 'RESOLVED' ? 'bg-emerald-100 text-emerald-900 shadow-2xs font-semibold' : 'text-gray-500'
              }`}
            >
              Done ({resolvedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Pane Desk: Ticket List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-2 max-h-[750px] overflow-y-auto pr-1">
          {filteredTickets.length === 0 ? (
            <div className="bg-white border border-[#E8E3EE] rounded-xl p-8 text-center text-gray-500 space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-gray-400" />
              <div className="text-xs font-semibold text-gray-700">No support tickets match this filter.</div>
              <div className="text-[11px] text-gray-400">All customer inquiries are addressed or filtered out.</div>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = activeTicket?.id === ticket.id;
              const dateStr = new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-[#1C1614] shadow-md ring-1 ring-[#1C1614]'
                      : 'bg-white border-[#E8E3EE] hover:border-gray-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-bold text-gray-800">{ticket.id}</span>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>

                  <div className="text-xs font-semibold text-gray-900 line-clamp-1">{ticket.subject}</div>

                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {ticket.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-3 mt-2 border-t border-gray-100">
                    <span className="font-medium text-gray-700">{ticket.customerName}</span>
                    <div className="flex items-center space-x-2">
                      {ticket.orderId && (
                        <span className="font-mono font-semibold text-[#6F4E37] bg-[#F2EDE6] px-1.5 py-0.5 rounded">
                          {ticket.orderId}
                        </span>
                      )}
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Ticket Inspection & Reply Desk */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="bg-white border border-[#E8E3EE] rounded-2xl shadow-xs overflow-hidden space-y-0">
              {/* Ticket Top Action Bar */}
              <div className="p-4 sm:p-5 border-b border-[#E8E3EE] bg-[#FAF9F8] flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#1C1614]">{activeTicket.id}</span>
                    {getPriorityBadge(activeTicket.priority)}
                    {getStatusBadge(activeTicket.status)}
                  </div>
                  <h2 className="font-serif font-bold text-base text-[#1C1614]">
                    {activeTicket.subject}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  {activeTicket.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center space-x-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, 'OPEN')}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition"
                    >
                      Re-open Inquiry
                    </button>
                  )}

                  {activeTicket.status === 'OPEN' && (
                    <button
                      onClick={() => handleUpdateStatus(activeTicket.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                    >
                      Take Ticket
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTicket(activeTicket.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="p-4 sm:p-5 border-b border-[#E8E3EE] bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Customer</span>
                  <div className="font-semibold text-gray-900 mt-0.5">{activeTicket.customerName}</div>
                  <div className="text-[11px] text-gray-500">{activeTicket.customerPhone}</div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Email</span>
                  <div className="font-semibold text-gray-900 mt-0.5">
                    <a href={`mailto:${activeTicket.customerEmail}`} className="text-[#6F4E37] underline hover:text-[#1C1614]">
                      {activeTicket.customerEmail}
                    </a>
                  </div>
                  <div className="text-[11px] text-gray-500">{activeTicket.category}</div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Associated Order</span>
                  {activeTicket.orderId ? (
                    <div className="mt-0.5">
                      <Link
                        href={`/admin/orders`}
                        className="inline-flex items-center space-x-1 font-mono font-bold text-xs text-[#6F4E37] hover:underline"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>{activeTicket.orderId}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 mt-0.5">No specific order</div>
                  )}
                </div>
              </div>

              {/* Message Thread Body */}
              <div className="p-4 sm:p-5 space-y-4 max-h-[360px] overflow-y-auto">
                {/* Initial Customer Message */}
                <div className="bg-[#FAF9F8] border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5 font-semibold text-gray-800">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span>{activeTicket.customerName}</span>
                      <span className="text-gray-400 font-normal">(Customer)</span>
                    </div>
                    <span className="text-gray-400 font-mono text-[10px]">
                      {new Date(activeTicket.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {activeTicket.message}
                  </p>
                </div>

                {/* Replies Thread */}
                {activeTicket.replies && activeTicket.replies.map((rep) => (
                  <div key={rep.id} className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-2 ml-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5 font-bold text-[#6F4E37]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{rep.sender}</span>
                      </div>
                      <span className="text-gray-400 font-mono text-[10px]">
                        {new Date(rep.time).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
                      {rep.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick Template Resolution Helpers */}
              <div className="px-4 sm:px-5 py-2.5 bg-[#FAF9F8] border-t border-b border-gray-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-gray-400 mr-1 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Quick Resolves:</span>
                </span>
                <button
                  type="button"
                  onClick={() => applyTemplate('Your order has been handed over to express air courier. Tracking link dispatched via SMS & WhatsApp.')}
                  className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-[10px] text-gray-700 transition"
                >
                  Tracking Update
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('Delivery address and postal pincode have been updated with our courier dispatch partner.')}
                  className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-[10px] text-gray-700 transition"
                >
                  Address Corrected
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('Our artisanal soaps contain 100% cold-pressed oils. To extend longevity, keep the bar on a well-drained wooden dish away from shower spray.')}
                  className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-[10px] text-gray-700 transition"
                >
                  Formulation Care Tip
                </button>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-4 sm:p-5 bg-white space-y-3">
                <textarea
                  rows="3"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Type reply to ${activeTicket.customerName}...`}
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8] resize-none"
                ></textarea>

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    Sends reply directly to <span className="font-semibold text-gray-700">{activeTicket.customerEmail}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-[#1C1614] hover:bg-[#342721] text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E3EE] rounded-2xl p-12 text-center text-gray-500 space-y-2">
              <Headphones className="w-10 h-10 mx-auto text-gray-300" />
              <div className="text-sm font-semibold text-gray-700">Select an inquiry to view details</div>
              <div className="text-xs text-gray-400">Manage customer conversations and resolve tickets here.</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

