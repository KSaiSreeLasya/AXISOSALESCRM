import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Users, FileText, Save, FolderOpen } from 'lucide-react';
import { Lead, SalesPerson, Note, SheetTab } from '../types';

interface AddLeadModalProps {
  salesPersons: SalesPerson[];
  sheetTabs: SheetTab[];
  onClose: () => void;
  onSave: (lead: Lead) => Promise<void>;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ salesPersons, sheetTabs, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    propertyType: 'Individual House',
    avgBill: '',
    assignedTo: '',
    note: '',
    nextReminder: '',
    sheetName: sheetTabs.length > 0 ? sheetTabs[0].name : 'Manual Entry'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setLoading(true);

    // Create unique ID for manual entry
    const timestamp = Date.now();
    const id = `manual-${timestamp}`;

    // Construct Note object if note exists
    const notes: Note[] = [];
    if (formData.note.trim()) {
      notes.push({
        id: `note-${timestamp}`,
        content: formData.note,
        timestamp: new Date().toISOString(),
        author: 'User' // Ideally current user name
      });
    }

    const newLead: Lead = {
      id,
      sheetName: formData.sheetName, // Use selected sheet name
      rowNumber: 0, // 0 indicates manual
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      postCode: '', // Optional or extracted from address if needed
      propertyType: formData.propertyType,
      avgBill: formData.avgBill || '0',
      status: 'New',
      value: 0, // Could calculate based on bill
      company: 'N/A',
      lastContact: new Date().toISOString(),
      nextReminder: formData.nextReminder,
      assignedTo: formData.assignedTo || undefined,
      notes: notes,
      activityLog: [{
        id: `log-${timestamp}`,
        timestamp: new Date().toISOString(),
        type: 'status_change',
        description: `Lead created manually in ${formData.sheetName}`,
        author: 'User'
      }]
    };

    try {
      await onSave(newLead);
      onClose();
    } catch (error) {
      console.error("Error saving lead", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Add New Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Sheet/Month Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Month (Sheet)</label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <select 
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm font-medium"
                value={formData.sheetName}
                onChange={e => setFormData({...formData, sheetName: e.target.value})}
              >
                {sheetTabs.map(tab => (
                  <option key={tab.gid} value={tab.name}>{tab.name}</option>
                ))}
                <option value="Manual Entry">Manual Entry (Other)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-2"></div>

          {/* Mandatory Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  required
                  type="text"
                  placeholder="Customer Name"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone No <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  required
                  type="tel"
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email ID</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="email"
                  placeholder="email@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="City, Street"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Solar Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property Type</label>
               <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                  value={formData.propertyType}
                  onChange={e => setFormData({...formData, propertyType: e.target.value})}
               >
                 <option value="Individual House">Individual House</option>
                 <option value="Apartment">Apartment</option>
                 <option value="Commercial">Commercial</option>
                 <option value="Industrial">Industrial</option>
                 <option value="School/College">School/College</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Avg Monthly Bill</label>
               <input 
                  type="text"
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                  value={formData.avgBill}
                  onChange={e => setFormData({...formData, avgBill: e.target.value})}
               />
             </div>
          </div>

          <div className="border-t border-gray-100 pt-4"></div>

          {/* CRM Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign To</label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <select 
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                  value={formData.assignedTo}
                  onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                >
                  <option value="">-- Select Sales Person --</option>
                  {salesPersons.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Next Reminder</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="datetime-local"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                  value={formData.nextReminder}
                  onChange={e => setFormData({...formData, nextReminder: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Note</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea 
                rows={3}
                placeholder="Add initial comments..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm resize-none"
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
              />
            </div>
          </div>

        </form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
          >
            {loading ? 'Saving...' : <><Save size={16} /> Create Lead</>}
          </button>
        </div>
      </div>
    </div>
  );
};