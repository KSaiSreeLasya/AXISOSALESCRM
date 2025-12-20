
import React, { useState } from 'react';
import { Search, Filter, FileSpreadsheet, UserPlus, Users, ChevronRight, Calendar, Pencil, Trash2, UserCheck, Layers, Plus, Clock, Sparkles, StickyNote, X, Send } from 'lucide-react';
import { Lead, SalesPerson, SheetTab, User, Note } from '../types';
import { LEAD_STATUSES } from '../utils/helpers';
import { AddLeadModal } from './AddLeadModal';

interface LeadListProps {
  leads: Lead[];
  sheetTabs: SheetTab[];
  salesPersons: SalesPerson[];
  currentUser: User;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onAutoAssign: (sheetScope: string) => void;
  onSelectLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onAddLead: (lead: Lead) => Promise<void>;
}

export const LeadList: React.FC<LeadListProps> = ({ leads, sheetTabs, salesPersons, currentUser, onUpdateLead, onAutoAssign, onSelectLead, onDeleteLead, onAddLead }) => {
  const [search, setSearch] = useState('');
  const [activeSheet, setActiveSheet] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [quickNoteLead, setQuickNoteLead] = useState<Lead | null>(null);
  const [newQuickNote, setNewQuickNote] = useState('');

  // Source of truth for sheets is the active configuration + "Manual Entry"
  const availableSheets = Array.from(new Set([
    'All', 
    ...sheetTabs.map(t => t.name),
    'Manual Entry'
  ])).sort((a, b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    return a.localeCompare(b);
  });

  const getBaseFilteredLeads = () => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(search.toLowerCase()) || 
        lead.phone.includes(search) ||
        (lead.address && lead.address.toLowerCase().includes(search.toLowerCase()));
      const matchesSheet = activeSheet === 'All' || lead.sheetName === activeSheet;
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      return matchesSearch && matchesSheet && matchesStatus;
    });
  };

  const baseLeads = getBaseFilteredLeads();
  const allLeadsCount = baseLeads.length;
  const myLeadsCount = baseLeads.filter(l => l.assignedTo === currentUser.id).length;
  const unassignedCountInView = baseLeads.filter(l => !l.assignedTo).length;

  const displayLeads = baseLeads.filter(lead => {
    if (viewMode === 'mine') return lead.assignedTo === currentUser.id;
    return true;
  });

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('site visit')) {
        if (s.includes('not done')) return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-green-100 text-green-700 border-green-200';
    }
    if (s.includes('won') || s.includes('advance')) return 'bg-green-100 text-green-700 border-green-200';
    if (s.includes('lost') || s.includes('not connected') || s.includes('not interested')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('call') || s.includes('busy')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (s.includes('quotation')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const isTargetPincode = (pincode: string | undefined) => {
    if (!pincode) return false;
    const cleanPin = parseInt(pincode.replace(/\D/g, ''), 10);
    return !isNaN(cleanPin) && cleanPin >= 500001 && cleanPin <= 509412;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const handleAddQuickNote = () => {
    if (!quickNoteLead || !newQuickNote.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      content: newQuickNote,
      timestamp: new Date().toISOString(),
      author: currentUser.name
    };
    onUpdateLead(quickNoteLead.id, { notes: [note, ...quickNoteLead.notes] });
    setNewQuickNote('');
    // Update local state for immediate feedback
    setQuickNoteLead({ ...quickNoteLead, notes: [note, ...quickNoteLead.notes] });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileSpreadsheet className="text-brand-600" size={20} />
                    Lead Data
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsAddingLead(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 shadow-sm transition-colors"
                  >
                    <Plus size={14} /> Add Lead
                  </button>
                  {currentUser.role === 'admin' && unassignedCountInView > 0 && (
                    <button 
                      onClick={() => onAutoAssign(activeSheet)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg hover:bg-brand-100 shadow-sm transition-colors border border-brand-200"
                      title={`Automatically assign ${unassignedCountInView} unassigned leads in ${activeSheet}`}
                    >
                      <UserPlus size={14} /> Auto Assign ({unassignedCountInView})
                    </button>
                  )}
                </div>
             </div>
             <div className="bg-gray-100 p-1 rounded-lg inline-flex self-start">
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Layers size={14} /> All Leads
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${viewMode === 'all' ? 'bg-gray-100 text-gray-700' : 'bg-white text-gray-500'}`}>{allLeadsCount}</span>
                </button>
                <button
                  onClick={() => setViewMode('mine')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'mine' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <UserCheck size={14} /> My Leads
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${viewMode === 'mine' ? 'bg-brand-50 text-brand-700' : 'bg-white text-gray-500'}`}>{myLeadsCount}</span>
                </button>
             </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap items-center mt-2 md:mt-0">
            <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <select 
                  className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white font-medium text-gray-700 appearance-none cursor-pointer"
                  value={activeSheet}
                  onChange={(e) => setActiveSheet(e.target.value)}
               >
                 {availableSheets.map(sheet => <option key={sheet} value={sheet}>{sheet}</option>)}
               </select>
            </div>
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold border-b">Full Name / Sheet Info</th>
              <th className="px-4 py-3 font-semibold border-b">Phone</th>
              <th className="px-4 py-3 font-semibold border-b">Avg Bill</th>
              <th className="px-4 py-3 font-semibold border-b">Assigned To</th>
              <th className="px-4 py-3 font-semibold border-b">Status</th>
              <th className="px-4 py-3 font-semibold border-b">Latest Note</th>
              <th className="px-4 py-3 font-semibold border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm">
            {displayLeads.map((lead) => {
              const isGreen = isTargetPincode(lead.postCode);
              const latestNote = lead.notes && lead.notes.length > 0 ? lead.notes[0] : null;
              
              return (
              <tr 
                key={lead.id} 
                className={`${isGreen ? 'bg-green-50/60 hover:bg-green-100/80' : 'hover:bg-blue-50/30'} transition-colors group cursor-pointer border-b border-gray-100`}
                onClick={() => onSelectLead(lead)}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors flex items-center gap-1">
                     {lead.name}
                     <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-400" />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-gray-600">{lead.sheetName}</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
                       <Clock size={10} /> {formatDate(lead.createdAt)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>{lead.propertyType}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-900 font-mono text-xs">{lead.phone}</div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{lead.avgBill}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <select 
                      value={lead.assignedTo || ''}
                      onChange={(e) => onUpdateLead(lead.id, { assignedTo: e.target.value })}
                      className="block w-full max-w-[140px] pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer bg-white"
                    >
                      <option value="">Unassigned</option>
                      {salesPersons.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                   <select 
                      value={lead.status}
                      onChange={(e) => onUpdateLead(lead.id, { status: e.target.value })}
                      className={`block w-full max-w-[140px] px-2 py-1 text-xs font-medium rounded border focus:outline-none cursor-pointer ${getStatusColor(lead.status)}`}
                    >
                      {LEAD_STATUSES.map(status => <option key={status} value={status} className="bg-white text-gray-900">{status}</option>)}
                   </select>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setQuickNoteLead(lead)}
                    className="flex flex-col text-left group/note max-w-[180px]"
                  >
                    {latestNote ? (
                      <>
                        <p className="text-xs text-gray-700 truncate line-clamp-1 group-hover/note:text-brand-600 font-medium">{latestNote.content}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 italic">{new Date(latestNote.timestamp).toLocaleDateString()}</p>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1 group-hover/note:text-brand-500 transition-colors">
                        <Plus size={10} /> Add Note
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-center flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                   <button onClick={() => onSelectLead(lead)} className="text-gray-500 hover:text-brand-600 p-2 rounded-lg transition-colors" title="View/Edit Full Details"><Pencil size={16} /></button>
                   <button onClick={() => onDeleteLead(lead.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg transition-colors" title="Delete Lead"><Trash2 size={16} /></button>
                </td>
              </tr>
            )})}
            {displayLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                   No leads found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Note Modal */}
      {quickNoteLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] border border-gray-100">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                    <h3 className="font-bold text-gray-800 text-sm">Notes for {quickNoteLead.name}</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{quickNoteLead.phone}</p>
                 </div>
                 <button onClick={() => setQuickNoteLead(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={18} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white min-h-[200px]">
                {quickNoteLead.notes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                     <StickyNote size={32} className="opacity-20 mb-2" />
                     <p className="text-xs italic">No notes added yet.</p>
                  </div>
                ) : (
                  quickNoteLead.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <p className="text-sm text-gray-800 leading-relaxed">{note.content}</p>
                       <div className="flex justify-between items-center mt-2 text-[10px] font-medium text-gray-400">
                          <span className="flex items-center gap-1"><UserCheck size={10} className="text-brand-500" /> {note.author || 'System'}</span>
                          <span>{new Date(note.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="relative">
                  <textarea 
                    autoFocus
                    value={newQuickNote} 
                    onChange={(e) => setNewQuickNote(e.target.value)} 
                    placeholder="Type a quick note..." 
                    rows={2} 
                    className="w-full pl-3 pr-12 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none shadow-inner"
                  />
                  <button 
                    onClick={handleAddQuickNote}
                    disabled={!newQuickNote.trim()}
                    className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${newQuickNote.trim() ? 'bg-brand-600 text-white shadow-sm hover:scale-105' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {isAddingLead && <AddLeadModal salesPersons={salesPersons} sheetTabs={sheetTabs} onClose={() => setIsAddingLead(false)} onSave={onAddLead} />}
    </div>
  );
};
