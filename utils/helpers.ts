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
  "Advance payment",
  "Lead finished",
  "Contacted",
  "Busy",
  "Call Back",
  "New", 
  "Repeated"
];

export const parseCSV = (csvText: string, sheetName: string): Lead[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Normalize headers to find columns loosely
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  
  const result: Lead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Regex to handle quoted CSV values properly
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    const values = matches ? matches.map(m => m.replace(/^"|"$/g, '')) : line.split(',');

    // Helper to extract value by possible header names
    const getVal = (keywords: string[], fallbackIndex: number) => {
      let index = -1;
      for (const key of keywords) {
        index = headers.findIndex(h => h.includes(key));
        if (index !== -1) break;
      }
      return values[index !== -1 ? index : fallbackIndex] || '';
    };

    // Mapping based on the specific spreadsheet screenshot provided
    const propertyType = getVal(['type_of_property', 'property'], 0);
    const avgBill = getVal(['average_monthly', 'bill', 'electricity'], 1);
    const name = getVal(['full name', 'name'], 2);
    const phone = getVal(['phone', 'mobile'], 3);
    const email = getVal(['email'], 4);
    const address = getVal(['street address', 'address'], 5);
    const postCode = getVal(['post_code', 'zip', 'pin'], 6);
    const rawStatus = getVal(['lead_status', 'status'], 7);
    const extraNotes = getVal(['notes', 'comment'], 8); // Sometimes extra columns exist

    // Skip empty rows (must have at least a name or phone)
    if (!name && !phone) continue;

    // Estimate deal value based on Bill amount
    const billNum = parseFloat(avgBill.replace(/[^0-9.]/g, '')) || 0;
    const estimatedValue = billNum > 0 ? billNum * 50 : 50000; 
    
    // Normalize status to match our dropdown if possible, otherwise keep raw
    let status = rawStatus || 'New';
    status = status.charAt(0).toUpperCase() + status.slice(1);

    const initialNotes: Note[] = [];
    if (extraNotes) {
      initialNotes.push({
        id: `note-init-${i}`,
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
      company: 'N/A', // Default
      address: address,
      postCode: postCode,
      status: status,
      value: estimatedValue,
      lastContact: new Date().toISOString().split('T')[0],
      notes: initialNotes,
      nextReminder: '',
      assignedTo: undefined,
      activityLog: [{
        id: `init-${i}`,
        timestamp: new Date().toISOString(),
        type: 'status_change',
        description: 'Lead imported from Google Sheet',
        author: 'System'
      }]
    });
  }

  return result;
};

// Mock data updated to match new structure
export const MOCK_DATA: Lead[] = [
  { 
    id: 'mock-1', sheetName: 'Demo Sheet', rowNumber: 1,
    propertyType: 'Individual House', avgBill: '2500', name: 'Gottipati Amith', phone: '919390741922', 
    email: 'gottipatiamith@gmail.com', address: 'Ae/52 Hill Colony', postCode: '508202', 
    status: 'Call Back', value: 125000, lastContact: '2023-11-01', 
    notes: [{ id: 'n1', content: 'Customer asked to call back in evening', timestamp: '2023-11-01T10:00:00Z', author: 'System' }], 
    nextReminder: '',
    activityLog: []
  }
];