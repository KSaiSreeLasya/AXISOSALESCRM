
import { Lead, Note, ActivityLogEntry, SalesPerson } from '../types';

// Map App Lead to DB Column format (snake_case)
export const mapLeadToDB = (lead: Lead) => ({
  id: lead.id,
  sheet_name: lead.sheetName,
  row_number: lead.rowNumber,
  property_type: lead.propertyType,
  avg_bill: lead.avgBill,
  name: lead.name,
  phone: lead.phone,
  email: lead.email,
  company: lead.company,
  address: lead.address,
  post_code: lead.postCode,
  status: lead.status,
  value: lead.value,
  last_contact: lead.lastContact,
  next_reminder: lead.nextReminder || null,
  assigned_to: lead.assignedTo || null,
  created_at: lead.createdAt
});

// Map DB Row to App Lead format (camelCase)
export const mapDBToLead = (row: any): Lead => ({
  id: row.id,
  sheetName: row.sheet_name,
  rowNumber: row.row_number,
  propertyType: row.property_type,
  avgBill: row.avg_bill,
  name: row.name,
  phone: row.phone,
  email: row.email,
  company: row.company || 'N/A',
  address: row.address,
  postCode: row.post_code,
  status: row.status,
  value: row.value,
  lastContact: row.last_contact,
  createdAt: row.created_at,
  nextReminder: row.next_reminder || '',
  assignedTo: row.assigned_to || undefined,
  // Relations - handle if they are joined or empty
  notes: Array.isArray(row.notes) ? row.notes.map(mapDBToNote) : [],
  activityLog: Array.isArray(row.activity_logs) ? row.activity_logs.map(mapDBToLog) : [],
});

export const mapDBToNote = (row: any): Note => ({
  id: row.id,
  content: row.content,
  timestamp: row.timestamp,
  author: row.author
});

export const mapDBToLog = (row: any): ActivityLogEntry => ({
  id: row.id,
  timestamp: row.timestamp,
  type: row.type,
  description: row.description,
  author: row.author
});
