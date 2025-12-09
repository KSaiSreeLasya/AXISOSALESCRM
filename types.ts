export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' | 'Call Back' | 'Not Connected' | 'Busy' | 'Not lifted' | 'Voice Message' | 'Quotation sent' | 'Site visit' | 'Site Visit - Done' | 'Site Visit - Not Done' | 'Advance payment' | 'Lead finished' | 'repeated';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'salesperson';
}

export interface SalesPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string; // stored locally for demo purposes
  active: boolean;
}

export interface Note {
  id: string;
  content: string;
  timestamp: string;
  author?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'status_change' | 'note_update' | 'assignment' | 'reminder';
  description: string;
  author?: string;
}

export interface Lead {
  id: string;
  sheetName: string; // e.g. "December", "November"
  rowNumber: number;
  
  // Specific fields from the spreadsheet
  propertyType: string;
  avgBill: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  address: string;
  postCode: string;
  status: string;
  
  // Computed fields for UI consistency
  value: number; // Estimated value based on bill or defaults
  lastContact: string; // Default to today if not present
  
  // Detailed Notes
  notes: Note[];
  nextReminder?: string; // ISO Date string
  
  // Assignment
  assignedTo?: string; // ID of the salesperson
  
  // History
  activityLog?: ActivityLogEntry[];
}

export interface SheetTab {
  name: string;
  gid: string;
}

export interface SheetConfig {
  baseUrl: string;
  tabs: SheetTab[];
  autoSync: boolean;
  lastSynced: number | null;
}

export interface DashboardMetrics {
  totalLeads: number;
  totalValue: number;
  conversionRate: number;
  wonLeads: number;
}