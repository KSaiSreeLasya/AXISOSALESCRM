import React, { useState } from 'react';
import { X, Calendar, User, CheckCircle2, Send, StickyNote, Plus } from 'lucide-react';
import { Lead, SalesPerson, Note } from '../types';
import { LEAD_STATUSES } from '../utils/helpers';

interface LeadDetailModalProps {
  lead: Lead;
  salesPersons: SalesPerson[];
  onClose: () => void;
  onUpdate: (leadId: string, updates: Partial<Lead>) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, salesPersons, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'status'>('overview');
  
  // Note input state
  const [newNote, setNewNote] = useState('');
  
  // Reminder input state
  const [reminder, setReminder] = useState(lead.nextReminder || '');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: `note-${Date.now()}`,
      content: newNote,
      timestamp: new Date().toISOString(),
      author: 'User' // In a real app this would be the logged-in user
    };

    onUpdate(lead.id, { notes: [note, ...lead.notes] });
    setNewNote('');
  };

  const handleSaveReminder = () => {
    onUpdate(lead.id, { nextReminder: reminder });
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();

    // Site Visit Logic
    if (s.includes('site visit')) {
        if (s.includes('not done')) return 'text-red-600 bg-red-50 border-red-200';
        return 'text-green-600 bg-green-50 border-green-200';
    }

    if (s.includes('won')) return 'text-green-600 bg-green-50 border-green-200';
    if (s.includes('lost') || s.includes('not')) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header - Matching 'No idea' screenshot style roughly */}
        <div className="px-6 pt-6 pb-2">
           <div className="flex justify-between items-start">
             <div>
                <h2 className="text-xl font-bold text-gray-900">{lead.name || 'Unknown Lead'}</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                   <span>{lead.company || 'N/A'}</span>
                   <span>•</span>
                   <span>{lead.name}</span>
                   <span>•</span>
                   <span>{lead.phone}</span>
                </div>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
               <X size={20} />
             </button>
           </div>
        </div>

        {/* Tabs - Centered Pill Style */}
        <div className="px-6 py-4">
           <div className="bg-gray-100/80 p-1 rounded-lg flex font-medium text-sm text-gray-600">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-green-700 shadow-sm' : 'hover:text-gray-800'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'notes' ? 'bg-white text-green-700 shadow-sm border border-green-100' : 'hover:text-gray-800'}`}
              >
                Notes
              </button>
              <button 
                onClick={() => setActiveTab('status')}
                className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'status' ? 'bg-white text-green-700 shadow-sm' : 'hover:text-gray-800'}`}
              >
                Status
              </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Assigned To</label>
                  <select 
                      value={lead.assignedTo || ''}
                      onChange={(e) => onUpdate(lead.id, { assignedTo: e.target.value })}
                      className="block w-full text-sm border-gray-200 rounded-lg shadow-sm focus:border-green-500 focus:ring-green-500 py-2"
                  >
                      <option value="">Unassigned</option>
                      {salesPersons.map(sp => (
                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Current Status</label>
                  <div className={`text-sm font-medium ${getStatusColor(lead.status)} px-3 py-2 rounded-lg inline-block`}>
                    {lead.status}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                 <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Email</label>
                    <p className="text-sm text-gray-900">{lead.email || '-'}</p>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Phone</label>
                    <p className="text-sm text-gray-900 font-mono">{lead.phone}</p>
                 </div>
                 <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Street Address</label>
                    <p className="text-sm text-gray-900">{lead.address}</p>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Type of Property</label>
                    <p className="text-sm text-gray-900">{lead.propertyType}</p>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Avg Monthly Bill</label>
                    <p className="text-sm text-gray-900">{lead.avgBill}</p>
                 </div>
              </div>

              {/* Reminder Section inside Overview */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                   <Calendar size={16} className="text-green-600"/> Next Reminder to Contact
                 </label>
                 <input 
                    type="datetime-local" 
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    onBlur={handleSaveReminder}
                    className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5"
                 />
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-4 h-full flex flex-col">
               <div className="shrink-0">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Add New Note</label>
                 <div className="relative">
                   <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a note..."
                      rows={3}
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 p-4 text-sm focus:border-green-500 focus:ring-green-500 focus:bg-white transition-colors resize-none mb-3"
                   />
                 </div>
                 <button 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      newNote.trim() 
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                 >
                    <Plus size={16} /> Add Note
                 </button>
               </div>

               <div className="pt-2 flex-1 min-h-0 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Notes ({lead.notes.length})</h3>
                  <div className="space-y-3 overflow-y-auto pr-1">
                    {lead.notes.length === 0 ? (
                       <div className="text-center py-8 text-gray-400 italic text-sm">
                         No notes yet. Add one above to get started.
                       </div>
                    ) : (
                      lead.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                           <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                           <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                              <span>{note.author}</span>
                              <span>{new Date(note.timestamp).toLocaleString()}</span>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
               </div>
            </div>
          )}

          {/* STATUS TAB */}
          {activeTab === 'status' && (
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {LEAD_STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => onUpdate(lead.id, { status })}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border text-left flex justify-between items-center transition-all ${
                        lead.status === status 
                          ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' 
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {status}
                      {lead.status === status && <CheckCircle2 size={16} className="text-green-600"/>}
                    </button>
                  ))}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};