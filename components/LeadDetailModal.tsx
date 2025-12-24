
import React, { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle2, Send, StickyNote, Plus, Clock, Save, Phone, Mail, MapPin, Home, Zap } from 'lucide-react';
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
  const [newNote, setNewNote] = useState('');
  const [reminder, setReminder] = useState(lead.nextReminder || '');
  
  // Local state for basic fields to handle smooth typing
  const [basicDetails, setBasicDetails] = useState({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    propertyType: lead.propertyType,
    avgBill: lead.avgBill
  });

  // Sync local state if lead changes (e.g., if updated from outside)
  useEffect(() => {
    setBasicDetails({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      propertyType: lead.propertyType,
      avgBill: lead.avgBill
    });
    setReminder(lead.nextReminder || '');
  }, [lead]);

  const handleFieldBlur = (field: string, value: string) => {
    if (lead[field as keyof Lead] !== value) {
      onUpdate(lead.id, { [field]: value });
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      content: newNote,
      timestamp: new Date().toISOString(),
      author: 'User'
    };
    onUpdate(lead.id, { notes: [note, ...lead.notes] });
    setNewNote('');
  };

  const handleSaveReminder = () => {
    if (lead.nextReminder !== reminder) {
      onUpdate(lead.id, { nextReminder: reminder });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-2">
           <div className="flex justify-between items-start">
             <div>
                <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                   <span>{lead.sheetName}</span>
                   <span>•</span>
                   <span className="font-mono">{lead.phone}</span>
                </div>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
           </div>
        </div>

        <div className="px-6 py-4">
           <div className="bg-gray-100/80 p-1 rounded-lg flex font-medium text-sm text-gray-600">
              <button onClick={() => setActiveTab('overview')} className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-brand-700 shadow-sm' : 'hover:text-gray-800'}`}>Overview & Edit</button>
              <button onClick={() => setActiveTab('notes')} className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'notes' ? 'bg-white text-brand-700 shadow-sm' : 'hover:text-gray-800'}`}>Notes</button>
              <button onClick={() => setActiveTab('status')} className={`flex-1 py-1.5 rounded-md transition-all ${activeTab === 'status' ? 'bg-white text-brand-700 shadow-sm' : 'hover:text-gray-800'}`}>Status</button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Primary Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Full Customer Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      value={basicDetails.name}
                      onChange={(e) => setBasicDetails({...basicDetails, name: e.target.value})}
                      onBlur={() => handleFieldBlur('name', basicDetails.name)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium"
                      placeholder="Enter name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="tel" 
                      value={basicDetails.phone}
                      onChange={(e) => setBasicDetails({...basicDetails, phone: e.target.value})}
                      onBlur={() => handleFieldBlur('phone', basicDetails.phone)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-mono"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="email" 
                      value={basicDetails.email}
                      onChange={(e) => setBasicDetails({...basicDetails, email: e.target.value})}
                      onBlur={() => handleFieldBlur('email', basicDetails.email)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                      placeholder="customer@email.com"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Full Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                    <textarea 
                      rows={2}
                      value={basicDetails.address}
                      onChange={(e) => setBasicDetails({...basicDetails, address: e.target.value})}
                      onBlur={() => handleFieldBlur('address', basicDetails.address)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all resize-none"
                      placeholder="Street, City, Pincode"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Property Type</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                      value={basicDetails.propertyType}
                      onChange={(e) => {
                        setBasicDetails({...basicDetails, propertyType: e.target.value});
                        onUpdate(lead.id, { propertyType: e.target.value });
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="Individual House">Individual House</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Avg Monthly Bill</label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      value={basicDetails.avgBill}
                      onChange={(e) => setBasicDetails({...basicDetails, avgBill: e.target.value})}
                      onBlur={() => handleFieldBlur('avgBill', basicDetails.avgBill)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                      placeholder="e.g. 2500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Assign To Salesperson</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                      value={lead.assignedTo || ''} 
                      onChange={(e) => onUpdate(lead.id, { assignedTo: e.target.value })} 
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {salesPersons.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Next Follow-up Reminder</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="datetime-local" 
                      value={reminder} 
                      onChange={(e) => setReminder(e.target.value)} 
                      onBlur={handleSaveReminder} 
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Clock size={16} className="text-brand-600" />
                   <span className="text-xs font-medium text-gray-500">Last Synced / Created:</span>
                   <span className="text-xs font-bold text-gray-700">{formatDate(lead.createdAt)}</span>
                </div>
                <div className="text-[10px] text-brand-600 font-bold uppercase flex items-center gap-1">
                   <Save size={10} /> Auto-Saving enabled
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4 h-full flex flex-col">
               <div className="shrink-0">
                 <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Write a new follow-up note..." rows={3} className="block w-full rounded-xl border-gray-200 bg-gray-50 p-4 text-sm focus:bg-white resize-none mb-3 outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                 <button onClick={handleAddNote} disabled={!newNote.trim()} className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${newNote.trim() ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <Plus size={16} /> Add Note to Timeline
                 </button>
               </div>
               <div className="pt-2 flex-1 overflow-y-auto pr-1 space-y-3">
                  {lead.notes.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 italic text-sm">No notes recorded yet.</div>
                  ) : (
                    lead.notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                         <p className="text-sm text-gray-800 leading-relaxed">{note.content}</p>
                         <div className="flex justify-between items-center mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><User size={10} /> {note.author || 'System'}</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(note.timestamp).toLocaleString()}</span>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}

          {activeTab === 'status' && (
             <div className="grid grid-cols-2 gap-3">
               {LEAD_STATUSES.map(status => (
                 <button 
                  key={status} 
                  onClick={() => onUpdate(lead.id, { status })} 
                  className={`px-4 py-3 rounded-xl text-xs font-bold border text-left flex justify-between items-center transition-all ${lead.status === status ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-brand-200 text-gray-600'}`}
                 >
                   {status}
                   {lead.status === status && <CheckCircle2 size={16} className="text-brand-600 animate-in zoom-in duration-200"/>}
                 </button>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
