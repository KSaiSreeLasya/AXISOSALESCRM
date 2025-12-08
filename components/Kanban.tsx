import React, { useState } from 'react';
import { Lead } from '../types';
import { Phone, MapPin, Download } from 'lucide-react';

interface KanbanProps {
  leads: Lead[];
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

const COLUMNS = [
  { id: 'Quotation sent', label: 'Quotation Sent', color: 'border-t-blue-500' },
  { id: 'Site visit', label: 'Site Visit', color: 'border-t-green-500' },
  { id: 'Advance payment', label: 'Advance Payment', color: 'border-t-purple-500' },
];

export const Kanban: React.FC<KanbanProps> = ({ leads, onUpdateLead }) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedLeadId) {
      onUpdateLead(draggedLeadId, { status });
      setDraggedLeadId(null);
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-full p-2">
      {COLUMNS.map(col => {
        // Filter leads exactly matching these statuses
        const columnLeads = leads.filter(l => l.status === col.id);
        
        return (
          <div 
            key={col.id} 
            className="min-w-[320px] w-[320px] flex flex-col bg-gray-50 rounded-xl h-full max-h-full border border-gray-200 shadow-sm"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className={`p-4 bg-white rounded-t-xl border-b border-gray-100 border-t-4 ${col.color} flex justify-between items-center`}>
              <h3 className="font-bold text-gray-800">{col.label}</h3>
              <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {columnLeads.length}
              </span>
            </div>
            
            {/* Drop Zone / List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columnLeads.map(lead => (
                <div 
                  key={lead.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move group hover:border-brand-200 relative"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-gray-300 group-hover:text-brand-200 uppercase tracking-wider">
                    {lead.sheetName}
                  </div>

                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{lead.name}</h4>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{lead.address || 'No Address'}</span>
                  </div>

                  <div className="bg-gray-50 rounded p-2 mb-3">
                     <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Bill:</span>
                        <span className="font-medium text-gray-900">{lead.avgBill}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium text-gray-900 truncate max-w-[120px]">{lead.propertyType}</span>
                     </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                     <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <Phone size={12} /> {lead.phone}
                     </a>
                     <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>

                  {/* Download Receipt Button for Advance Payment Column */}
                  {col.id === 'Advance payment' && (
                    <a
                      href="https://crm.axisogreen.in/#/projects"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors group-hover:border-purple-300"
                    >
                      <Download size={14} />
                      Download Receipt
                    </a>
                  )}
                </div>
              ))}
              
              {columnLeads.length === 0 && (
                <div className="h-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 gap-2 m-2">
                  <span className="text-xs">Drag leads here</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};