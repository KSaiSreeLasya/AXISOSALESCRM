
import { Lead, Note } from '../types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const LEAD_STATUSES = [
  "Not lifted",
  "Not connected",
  "Voice Message",
  "Quotation sent",
  "Site visit",
  "Site Visit - Done",
  "Site Visit - Not Done",
  "Advance payment",
  "Lead finished",
  "Contacted",
  "Busy",
  "Call Back",
  "New", 
  "Repeated"
];

// Robust CSV Line Parser that handles quotes and commas correctly
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle escaped quotes ("") by looking ahead
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const parseCSV = (csvText: string, sheetName: string): Lead[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse headers safely
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().replace(/^"|"$/g, ''));
  
  const result: Lead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    // Helper to extract value by possible header names
    const getVal = (keywords: string[], fallbackIndex: number) => {
      let index = -1;
      for (const key of keywords) {
        index = headers.findIndex(h => h.includes(key));
        if (index !== -1) break;
      }
      // Clean up quotes just in case
      const val = values[index !== -1 ? index : fallbackIndex] || '';
      return val.replace(/^"|"$/g, '');
    };

    // Mapping based on the specific spreadsheet structure
    const propertyType = getVal(['type_of_property', 'property'], 0);
    const avgBill = getVal(['average_monthly', 'bill', 'electricity'], 1);
    const name = getVal(['full name', 'name'], 2);
    const phone = getVal(['phone', 'mobile'], 3);
    const email = getVal(['email'], 4);
    const address = getVal(['street address', 'address'], 5);
    const postCode = getVal(['post_code', 'zip', 'pin', 'pincode', 'postal'], 6);
    const rawStatus = getVal(['lead_status', 'status'], 7);
    const extraNotes = getVal(['notes', 'comment'], 8); 

    if (!name && !phone) continue;

    const billNum = parseFloat(avgBill.replace(/[^0-9.]/g, '')) || 0;
    const estimatedValue = billNum > 0 ? billNum * 50 : 50000; 
    
    let status = rawStatus || 'New';
    status = status.charAt(0).toUpperCase() + status.slice(1);

    const initialNotes: Note[] = [];
    if (extraNotes) {
      initialNotes.push({
        id: `note-init-${sheetName}-${i}`,
        content: extraNotes,
        timestamp: new Date().toISOString(),
        author: 'Import'
      });
    }

    result.push({
      id: `${sheetName}-${i}`, 
      sheetName,
      rowNumber: i + 1,
      propertyType: propertyType || 'Individual House',
      avgBill: avgBill,
      name: name,
      phone: phone,
      email: email,
      company: 'N/A',
      address: address,
      postCode: postCode,
      status: status,
      value: estimatedValue,
      lastContact: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      notes: initialNotes,
      nextReminder: '',
      assignedTo: undefined,
      activityLog: [{
        id: `init-${sheetName}-${i}`,
        timestamp: new Date().toISOString(),
        type: 'status_change',
        description: 'Lead imported from Google Sheet',
        author: 'System'
      }]
    });
  }

  return result;
};

export const MOCK_DATA: Lead[] = [
  { 
    id: 'mock-1', sheetName: 'Demo Sheet', rowNumber: 1,
    propertyType: 'Individual House', avgBill: '2500', name: 'Gottipati Amith', phone: '919390741922', 
    email: 'gottipatiamith@gmail.com', address: 'Ae/52 Hill Colony', postCode: '508202', 
    status: 'Call Back', value: 125000, lastContact: '2023-11-01', 
    createdAt: '2023-11-01T09:00:00Z',
    notes: [{ id: 'n1', content: 'Customer asked to call back in evening', timestamp: '2023-11-01T10:00:00Z', author: 'System' }], 
    nextReminder: '',
    activityLog: []
  }
];
