import React, { useState } from 'react';
import { Search, Filter, FileSpreadsheet, UserPlus, Users, ChevronRight, Calendar, Pencil, Trash2, UserCheck, Layers, Plus } from 'lucide-react';
import { Lead, SalesPerson, SheetTab, User } from '../types';
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

  // Combine configured tabs with any other sheet names found in leads
  const availableSheets = Array.from(new Set([
    'All', 
    ...sheetTabs.map(t => t.name),
    ...leads.map(l => l.sheetName)
  ]));

  // Base filter (Search + Sheet + Status) - applied before splitting into "All" vs "Mine"
  const getBaseFilteredLeads = () => {
    return leads.filter(lead => {
      // 1. Text Search
      const matchesSearch = 
        lead.name.toLowerCase().includes(search.toLowerCase()) || 
        lead.phone.includes(search) ||
        (lead.address && lead.address.toLowerCase().includes(search.toLowerCase())) ||
        (lead.postCode && lead.postCode.includes(search));
      
      // 2. Sheet Filter
      const matchesSheet = activeSheet === 'All' || lead.sheetName === activeSheet;
      
      // 3. Status Filter
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

      return matchesSearch && matchesSheet && matchesStatus;
    });
  };

  const baseLeads = getBaseFilteredLeads();
  
  // Calculate counts based on the current filters
  const allLeadsCount = baseLeads.length;
  const myLeadsCount = baseLeads.filter(l => l.assignedTo === currentUser.id).length;

  // Apply the final View Mode filter for the table display
  const displayLeads = baseLeads.filter(lead => {
    if (viewMode === 'mine') {
      return lead.assignedTo === currentUser.id;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    
    // Site Visit Logic
    if (s.includes('site visit')) {
        if (s.includes('not done')) return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-green-100 text-green-700 border-green-200'; // "Done" or generic "Site visit"
    }

    if (s.includes('won') || s.includes('advance')) return 'bg-green-100 text-green-700 border-green-200';
    if (s.includes('lost') || s.includes('not connected')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('call') || s.includes('busy') || s.includes('voice')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (s.includes('quotation') || s.includes('contacted')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const isTargetPincode = (pincode: string | undefined) => {
    if (!pincode) return false;
    // Extract numbers just in case there are spaces
    const cleanPin = parseInt(pincode.replace(/\D/g, ''), 10);
    return !isNaN(cleanPin) && cleanPin >= 500001 && cleanPin <= 509412;
  };

  const unassignedCount = displayLeads.filter(l => !l.assignedTo).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileSpreadsheet className="text-brand-600" size={20} />
                    Lead Data
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Manage, assign, and track all your incoming sheet leads.</p>
                </div>
                
                {/* Add Lead Button */}
                <button 
                  onClick={() => setIsAddingLead(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 shadow-sm transition-colors"
                >
                  <Plus size={14} /> Add Lead
                </button>
             </div>

             {/* My Leads / All Leads Toggle */}
             <div className="bg-gray-100 p-1 rounded-lg inline-flex self-start">
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Layers size={14} />
                  All Leads
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${viewMode === 'all' ? 'bg-gray-100 text-gray-700' : 'bg-white text-gray-500'}`}>
                    {allLeadsCount}
                  </span>
                </button>
                <button
                  onClick={() => setViewMode('mine')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === 'mine' 
                      ? 'bg-white text-brand-700 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <UserCheck size={14} />
                  My Leads
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${viewMode === 'mine' ? 'bg-brand-50 text-brand-700' : 'bg-white text-gray-500'}`}>
                    {myLeadsCount}
                  </span>
                </button>
             </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto flex-wrap items-center mt-2 md:mt-0">
            
            {/* Mobile Add Lead Button */}
            <button 
              onClick={() => setIsAddingLead(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700 shadow-sm"
            >
              <Plus size={16} /> Add
            </button>

            {/* Sheet Filter Dropdown */}
            <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <select 
                  className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white font-medium text-gray-700 appearance-none cursor-pointer hover:border-brand-300 transition-colors"
                  value={activeSheet}
                  onChange={(e) => setActiveSheet(e.target.value)}
               >
                 {availableSheets.map(sheet => (
                   <option key={sheet} value={sheet}>{sheet}</option>
                 ))}
               </select>
            </div>

             {/* Status Filter Dropdown */}
             <div className="relative hidden sm:block">
                <select 
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white text-gray-600 cursor-pointer hover:border-brand-300 transition-colors"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>

            {/* Search Input */}
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

            {/* Auto Assign Button */}
            {viewMode === 'all' && (
              <button 
                onClick={() => onAutoAssign(activeSheet)}
                disabled={unassignedCount === 0 || salesPersons.length === 0}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border whitespace-nowrap ${
                  unassignedCount > 0 && salesPersons.length > 0
                    ? 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100'
                    : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                }`}
                title={`Distribute ${unassignedCount} unassigned leads from '${activeSheet}' equally among sales team`}
              >
                 <UserPlus size={16} />
                 <span className="hidden sm:inline">Auto Assign</span>
                 {unassignedCount > 0 && <span className="ml-1 bg-white px-1.5 rounded-full text-xs border border-brand-200">{unassignedCount}</span>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold border-b">Full Name</th>
              <th className="px-4 py-3 font-semibold border-b">Phone / Info</th>
              <th className="px-4 py-3 font-semibold border-b">Avg Bill</th>
              <th className="px-4 py-3 font-semibold border-b">Assigned To</th>
              <th className="px-4 py-3 font-semibold border-b">Status</th>
              <th className="px-4 py-3 font-semibold border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm">
            {displayLeads.map((lead) => {
              const isGreen = isTargetPincode(lead.postCode);
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
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                    <span>{lead.propertyType}</span>
                    <span className="text-gray-300">•</span>
                    <span>{lead.sheetName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-900 font-mono text-xs">{lead.phone}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[140px]" title={`${lead.address} ${lead.postCode}`}>
                    {lead.address}{lead.postCode ? `, ${lead.postCode}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{lead.avgBill}</td>
                
                {/* Assigned To Dropdown - Stop propagation to not open modal */}
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <select 
                      value={lead.assignedTo || ''}
                      onChange={(e) => onUpdateLead(lead.id, { assignedTo: e.target.value })}
                      className={`block w-full max-w-[140px] pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer ${
                        lead.assignedTo ? 'bg-white border-gray-200 text-gray-900' : 'bg-transparent border-gray-300 text-gray-500 italic'
                      }`}
                    >
                      <option value="">Unassigned</option>
                      {salesPersons.map(sp => (
                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                      ))}
                    </select>
                    {!lead.assignedTo && <Users size={12} className="absolute right-2 top-1.5 text-gray-300 pointer-events-none" />}
                  </div>
                </td>

                {/* Status Dropdown - Stop propagation */}
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                   <select 
                      value={lead.status}
                      onChange={(e) => onUpdateLead(lead.id, { status: e.target.value })}
                      className={`block w-full max-w-[140px] px-2 py-1 text-xs font-medium rounded border focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-colors ${getStatusColor(lead.status)}`}
                    >
                      {LEAD_STATUSES.map(status => (
                        <option key={status} value={status} className="bg-white text-gray-900">{status}</option>
                      ))}
                   </select>
                </td>

                {/* Actions: Edit & Delete */}
                <td className="px-4 py-3 text-center flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                   <button 
                    onClick={() => onSelectLead(lead)}
                    className="text-gray-500 hover:text-brand-600 hover:bg-brand-50 p-2 rounded-lg transition-colors"
                    title="Edit Lead"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => onDeleteLead(lead.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Delete Lead"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )})}
            {displayLeads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Filter size={24} />
                    <p>No leads found matching your filters.</p>
                    {viewMode === 'mine' && <p className="text-xs">You have no leads assigned yet.</p>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      {isAddingLead && (
        <AddLeadModal 
          salesPersons={salesPersons}
          sheetTabs={sheetTabs}
          onClose={() => setIsAddingLead(false)} 
          onSave={onAddLead} 
        />
      )}
    </div>
  );
};