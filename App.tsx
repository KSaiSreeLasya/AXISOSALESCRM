import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Users, KanbanSquare, Settings, RefreshCw, X, Sparkles, ShieldCheck, LogOut, Zap } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { LeadList } from './components/LeadList';
import { Kanban } from './components/Kanban';
import { SalesTeam } from './components/SalesTeam';
import { LeadDetailModal } from './components/LeadDetailModal';
import { Login } from './components/Login';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Lead, SheetConfig, DashboardMetrics, SalesPerson, ActivityLogEntry, Note, User } from './types';
import { parseCSV, MOCK_DATA } from './utils/helpers';
import { analyzeLead } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { mapLeadToDB, mapDBToLead } from './utils/dbHelpers';

// Base ID of the provided sheet
const SHEET_ID = "1QY8_Q8-ybLKNVs4hynPZslZDwUfC-PIJrViJfL0-tpM";

// Default Config with known GIDs from user prompt
const DEFAULT_CONFIG: SheetConfig = {
  baseUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`,
  tabs: [
    { name: 'December', gid: '1355430272' },
    { name: 'November', gid: '1892152973' },
    { name: 'October', gid: '0' }
  ],
  autoSync: true,
  lastSynced: null,
};

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App State
  const [currentView, setCurrentView] = useState<'dashboard' | 'leads' | 'kanban' | 'team' | 'settings'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [config, setConfig] = useState<SheetConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  
  // Selected Lead for Detail Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Delete Confirmation State
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  // Sales Team State
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);

  // AI Modal State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzingLead, setAnalyzingLead] = useState<Lead | null>(null);

  // Computed Metrics
  const metrics: DashboardMetrics = React.useMemo(() => {
    return {
      totalLeads: leads.length,
      totalValue: leads.reduce((acc, l) => acc + l.value, 0),
      wonLeads: leads.filter(l => l.status.toLowerCase().includes('won') || l.status.toLowerCase().includes('visit')).length,
      conversionRate: leads.length ? (leads.filter(l => l.status.toLowerCase().includes('won')).length / leads.length) * 100 : 0
    };
  }, [leads]);

  // Handle Login
  const handleLogin = async (email: string, pass: string) => {
    setIsLoggingIn(true);
    setLoginError('');

    try {
      // 1. Check Admin Credentials (Hardcoded as per request)
      if (email === 'admin@axisogreen.in' && pass === 'admin2024') {
        setCurrentUser({
          id: 'admin',
          name: 'Admin User',
          email: email,
          role: 'admin'
        });
        setCurrentView('dashboard');
        setIsLoggingIn(false);
        return;
      }

      // 2. Check Sales Person Credentials from DB
      // Note: In a real production app, use Supabase Auth. This is a custom check per request.
      const { data: spData, error } = await supabase
        .from('sales_persons')
        .select('*')
        .eq('email', email)
        .eq('password', pass) // Direct comparison as requested (Not secure for Prod)
        .single();

      if (error || !spData) {
        throw new Error('Invalid email or password');
      }

      if (!spData.active) {
         throw new Error('Account is inactive. Contact admin.');
      }

      setCurrentUser({
        id: spData.id,
        name: spData.name,
        email: spData.email,
        role: 'salesperson'
      });
      setCurrentView('dashboard');

    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLeads([]);
    setSalesPersons([]);
  };

  // Fetch Data from Supabase
  const fetchData = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Fetch Sales Persons
      const { data: spData, error: spError } = await supabase.from('sales_persons').select('*');
      if (spError) console.warn('Error fetching sales persons (check RLS?):', spError);
      setSalesPersons(spData || []);

      // Fetch Leads with Relations
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          notes (*),
          activity_logs (*)
        `)
        .order('created_at', { ascending: false });
      
      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        return;
      }

      if (leadsData) {
        // Map DB snake_case to CamelCase
        const mappedLeads = leadsData.map(mapDBToLead);
        setLeads(mappedLeads);
      }
    } catch (err) {
      console.error('Unexpected error fetching data:', err);
    }
  }, [currentUser]);

  // Load data when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  const syncData = useCallback(async () => {
    setIsLoading(true);
    setSyncStatus('Starting sync...');
    const errors: string[] = [];

    try {
      // Iterate through all configured tabs
      for (const tab of config.tabs) {
        setSyncStatus(`Fetching ${tab.name}...`);
        const url = `${config.baseUrl}&gid=${tab.gid}`;
        
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const text = await response.text();
          const sheetLeads = parseCSV(text, tab.name);

          console.log(`Parsed ${sheetLeads.length} leads from ${tab.name}`);

          if (sheetLeads.length > 0) {
            setSyncStatus(`Syncing ${sheetLeads.length} records for ${tab.name}...`);
            
            // --- MERGE LOGIC START ---
            // Fetch existing data from DB to preserve Assigned To, Status, etc.
            const { data: existingRows, error: fetchError } = await supabase
                .from('leads')
                .select('id, status, assigned_to, next_reminder, last_contact')
                .eq('sheet_name', tab.name);
            
            if (fetchError) console.error('Error fetching existing leads for merge:', fetchError);

            // Create a map for fast lookup
            // Explicitly cast existing rows to any to allow property access
            const existingMap = new Map<string, any>((existingRows || []).map((r: any) => [r.id, r]));

            // Merge CSV data with DB data
            const mergedLeads = sheetLeads.map(lead => {
                const existing = existingMap.get(lead.id);
                if (existing) {
                    return {
                        ...lead,
                        // Preserve CRM fields from DB if they exist. 
                        // If DB value is null/undefined, fallback to what's in CSV (which is usually default 'New' or 'Unassigned')
                        status: existing.status ?? lead.status, 
                        assignedTo: existing.assigned_to ?? lead.assignedTo,
                        nextReminder: existing.next_reminder ?? lead.nextReminder
                        // We do NOT overwrite name/phone/bill from DB, we let the Sheet update those (Sheet is master for contact info)
                    };
                }
                return lead;
            });
            // --- MERGE LOGIC END ---

            // 1. Upsert Leads (using merged data)
            const dbLeads = mergedLeads.map(mapLeadToDB);
            
            // Using upsert. Ensure RLS policies allow 'insert' and 'update' for anon if not using auth
            const { error: upsertError } = await supabase
              .from('leads')
              .upsert(dbLeads, { onConflict: 'id', ignoreDuplicates: false }); 
            
            if (upsertError) {
                console.error(`Supabase Upsert Error for ${tab.name}:`, upsertError);
                throw upsertError;
            }

            // 2. Insert Initial Notes & Logs
            // We only want to insert initial notes if they are NEW. 
            // 'upsert' with ignoreDuplicates: true will handle this based on ID.
            const initialNotes = sheetLeads.flatMap(l => 
              l.notes.map(n => ({ 
                id: n.id, lead_id: l.id, content: n.content, timestamp: n.timestamp, author: n.author 
              }))
            );
            
            const initialLogs = sheetLeads.flatMap(l => 
                l.activityLog ? l.activityLog.map(log => ({
                    id: log.id, lead_id: l.id, type: log.type, description: log.description, timestamp: log.timestamp, author: log.author
                })) : []
            );

            if (initialNotes.length > 0) {
                const { error: notesError } = await supabase.from('notes').upsert(initialNotes, { onConflict: 'id', ignoreDuplicates: true });
                if (notesError) console.error('Notes upsert error:', notesError);
            }
            if (initialLogs.length > 0) {
               const { error: logsError } = await supabase.from('activity_logs').upsert(initialLogs, { onConflict: 'id', ignoreDuplicates: true });
               if (logsError) console.error('Logs upsert error:', logsError);
            }
          }

        } catch (err: any) {
          console.error(`Failed to sync ${tab.name}`, err);
          errors.push(`${tab.name} (${err.message || 'Unknown error'})`);
        }
      }

      setConfig(prev => ({ ...prev, lastSynced: Date.now() }));
      
      if (errors.length > 0) {
          setSyncStatus(`Errors: ${errors.join(', ')}`);
          alert(`Sync encountered errors:\n${errors.join('\n')}\n\nCheck console for details.`);
      } else {
          setSyncStatus('Sync complete!');
      }
      
      // Refresh local state from DB
      await fetchData();

    } catch (err) {
      console.error(err);
      setSyncStatus("Sync failed completely.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus(''), 5000);
    }
  }, [config, fetchData]);

  // Handle Adding Manual Lead
  const handleAddLead = async (newLead: Lead) => {
    try {
      // 1. Insert Lead into DB
      const dbLead = mapLeadToDB(newLead);
      const { error: leadError } = await supabase.from('leads').insert(dbLead);
      if (leadError) throw leadError;

      // 2. Insert Notes (if any)
      if (newLead.notes.length > 0) {
        const dbNotes = newLead.notes.map(n => ({
          id: n.id,
          lead_id: newLead.id,
          content: n.content,
          timestamp: n.timestamp,
          author: n.author
        }));
        const { error: noteError } = await supabase.from('notes').insert(dbNotes);
        if (noteError) console.error("Error inserting manual note", noteError);
      }

      // 3. Insert Activity Log
      if (newLead.activityLog && newLead.activityLog.length > 0) {
        const dbLogs = newLead.activityLog.map(l => ({
          id: l.id,
          lead_id: newLead.id,
          type: l.type,
          description: l.description,
          timestamp: l.timestamp,
          author: l.author
        }));
        const { error: logError } = await supabase.from('activity_logs').insert(dbLogs);
        if (logError) console.error("Error inserting manual log", logError);
      }
      
      // 4. Update local state
      setLeads(prev => [newLead, ...prev]);

    } catch (err: any) {
      console.error("Failed to add lead", err);
      alert(`Error creating lead: ${err.message}`);
    }
  };

  // Handle updates to lead (Status, Assignment, Notes)
  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    // 1. Optimistic Update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
    
    try {
      const currentLead = leads.find(l => l.id === leadId);
      if (!currentLead) return;

      // Prepare DB updates
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo || null;
      if (updates.nextReminder) dbUpdates.next_reminder = updates.nextReminder;

      // Update Lead Table
      if (Object.keys(dbUpdates).length > 0) {
          const { error } = await supabase.from('leads').update(dbUpdates).eq('id', leadId);
          if (error) throw error;

          // Log Activity for status change
          if (updates.status && updates.status !== currentLead.status) {
              await supabase.from('activity_logs').insert({
                  lead_id: leadId,
                  type: 'status_change',
                  description: `Status changed from ${currentLead.status} to ${updates.status}`,
                  author: currentUser?.name || 'User'
              });
          }
          // Log Activity for Assignment
           if (updates.assignedTo !== undefined && updates.assignedTo !== currentLead.assignedTo) {
             const spName = salesPersons.find(sp => sp.id === updates.assignedTo)?.name || 'Unknown';
              await supabase.from('activity_logs').insert({
                  lead_id: leadId,
                  type: 'assignment',
                  description: `Assigned to ${spName}`,
                  author: currentUser?.name || 'User'
              });
          }
      }

      // Handle New Notes
      if (updates.notes && updates.notes.length > currentLead.notes.length) {
          const newNote = updates.notes[0]; // Assuming the new note is added to the top
          await supabase.from('notes').insert({
              lead_id: leadId,
              content: newNote.content,
              timestamp: newNote.timestamp,
              author: currentUser?.name || 'User'
          });
          
           await supabase.from('activity_logs').insert({
              lead_id: leadId,
              type: 'note_update',
              description: 'Note added',
              author: currentUser?.name || 'User'
          });
      }

      // Update selected lead if open
      if (selectedLead && selectedLead.id === leadId) {
          // Merge updates into selected lead
          setSelectedLead(prev => prev ? ({ ...prev, ...updates }) : null);
      }

    } catch (err: any) {
      console.error("Update failed", err);
      alert(`Failed to save changes: ${err.message || 'Unknown error'}`);
    }
  };

  const handleAutoAssign = async (sheetScope: string) => {
    if (salesPersons.length === 0) return;
    
    // Filter unassigned leads in scope
    const unassignedLeads = leads.filter(l => 
        (sheetScope === 'All' || l.sheetName === sheetScope) && !l.assignedTo
    );

    if (unassignedLeads.length === 0) return;

    setIsLoading(true);
    let spIndex = 0;
    
    try {
        for (const lead of unassignedLeads) {
            const sp = salesPersons[spIndex % salesPersons.length];
            spIndex++;
            
            // Update DB
            await supabase.from('leads').update({ assigned_to: sp.id }).eq('id', lead.id);
            await supabase.from('activity_logs').insert({
                lead_id: lead.id,
                type: 'assignment',
                description: `Auto-assigned to ${sp.name}`,
                author: 'System'
            });
        }
        await fetchData(); // Refresh all
    } catch (err) {
        console.error("Auto assign failed", err);
    } finally {
        setIsLoading(false);
    }
  };

  // Trigger Confirmation Modal
  const requestDeleteLead = (leadId: string) => {
    setLeadToDelete(leadId);
  };

  // Actual Delete Logic triggered by Modal
  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    const leadId = leadToDelete;

    // Optimistic delete
    setLeads(prev => prev.filter(l => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);
    setLeadToDelete(null); // Close modal

    try {
      // 1. Delete Related Data First (Manual Cascade) to prevent FK errors
      await supabase.from('notes').delete().eq('lead_id', leadId);
      await supabase.from('activity_logs').delete().eq('lead_id', leadId);

      // 2. Delete the Lead
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      
      if (error) {
         console.error("Supabase Delete Error:", error);
         throw error;
      }
    } catch (err: any) {
      console.error("Delete failed", err);
      alert(`Delete failed: ${err.message}`);
      fetchData(); // Revert state from DB if failed
    }
  };

  const handleAnalyze = async (lead: Lead) => {
    setAnalyzingLead(lead);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    const result = await analyzeLead(lead);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  // Sheet Config Handlers (Local state only for now, could be DB)
  const handleAddSheet = (name: string, gid: string) => {
    setConfig(prev => ({
      ...prev,
      tabs: [...prev.tabs, { name, gid }]
    }));
  };

  const handleRemoveSheet = (gid: string) => {
    setConfig(prev => ({
      ...prev,
      tabs: prev.tabs.filter(t => t.gid !== gid)
    }));
  };

  // Sales Team Handlers (DB Connected)
  const handleAddSalesPerson = async (member: SalesPerson) => {
    try {
        const { error } = await supabase.from('sales_persons').insert({
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            password: member.password,
            active: member.active
        });
        if (error) throw error;
        setSalesPersons(prev => [...prev, member]);
    } catch (err: any) {
        console.error("Failed to add sales person", err);
        alert(`Failed to add member: ${err.message}`);
    }
  };

  const handleUpdateSalesPerson = async (id: string, updates: Partial<SalesPerson>) => {
    try {
        const { error } = await supabase.from('sales_persons').update({
            name: updates.name,
            email: updates.email,
            phone: updates.phone,
            password: updates.password
        }).eq('id', id);

        if (error) throw error;
        
        // Update local state
        setSalesPersons(prev => prev.map(sp => sp.id === id ? { ...sp, ...updates } : sp));
        
        // If updating self, update current user name/email locally
        if (currentUser && currentUser.id === id) {
            setCurrentUser(prev => prev ? ({ ...prev, name: updates.name || prev.name, email: updates.email || prev.email }) : null);
        }
    } catch (err: any) {
        console.error("Failed to update sales person", err);
        alert(`Failed to update member: ${err.message}`);
    }
  };

  const handleRemoveSalesPerson = async (id: string) => {
    try {
        const { error } = await supabase.from('sales_persons').delete().eq('id', id);
        if (error) throw error;
        setSalesPersons(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
        console.error("Failed to remove sales person", err);
        alert(`Failed to delete member: ${err.message}`);
    }
  };

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return <Login onLogin={handleLogin} isLoading={isLoggingIn} error={loginError} />;
  }

  // Define Menu Items based on Role
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', visible: true },
    { id: 'leads', icon: Users, label: 'Leads Data', visible: true },
    { id: 'kanban', icon: KanbanSquare, label: 'Pipeline', visible: true },
    { id: 'team', icon: ShieldCheck, label: 'Sales Team', visible: true }, // Requested to be visible for all? "when salesperson ... sheet config should not be display". Implies Team is visible.
    { id: 'settings', icon: Settings, label: 'Sheet Config', visible: currentUser.role === 'admin' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 shadow-sm hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="flex flex-col">
             <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">Axiso <span className="text-brand-600">Green</span></h1>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Sales CRM</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.filter(item => item.visible).map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === item.id 
                  ? 'bg-brand-50 text-brand-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
           <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                 {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                 <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 z-10 shrink-0">
          <div className="flex items-center gap-4 md:hidden">
             <span className="font-bold text-gray-900">Axiso Green</span>
          </div>
          
          <h1 className="text-xl font-bold text-gray-800 hidden md:block capitalize">
            {currentView === 'team' ? 'Sales Team' : currentView === 'leads' ? 'Leads Database' : currentView}
          </h1>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:inline font-medium">
               {syncStatus || (config.lastSynced ? `Synced: ${new Date(config.lastSynced).toLocaleTimeString()}` : '')}
            </span>
            <button 
              onClick={syncData}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition-all ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Syncing...' : 'Sync All Sheets'}
            </button>
            <button className="md:hidden text-gray-500" onClick={handleLogout}>
               <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 scrollbar-hide bg-gray-50/50">
          {currentView === 'dashboard' && <Dashboard leads={leads} metrics={metrics} />}
          
          {currentView === 'leads' && (
            <LeadList 
                leads={leads} 
                sheetTabs={config.tabs}
                salesPersons={salesPersons}
                currentUser={currentUser}
                onUpdateLead={handleUpdateLead}
                onAutoAssign={handleAutoAssign}
                onSelectLead={setSelectedLead}
                onDeleteLead={requestDeleteLead}
                onAddLead={handleAddLead}
            />
          )}

          {currentView === 'kanban' && <Kanban leads={leads} onUpdateLead={handleUpdateLead} />}
          
          {currentView === 'team' && (
            <SalesTeam 
                currentUser={currentUser}
                members={salesPersons} 
                onAddMember={handleAddSalesPerson} 
                onRemoveMember={handleRemoveSalesPerson}
                onUpdateMember={handleUpdateSalesPerson}
            />
          )}
          
          {currentView === 'settings' && currentUser.role === 'admin' && (
            <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-in fade-in duration-500">
               <h2 className="text-xl font-bold mb-6 text-gray-800">Sheet Configuration</h2>
               
               <div className="space-y-6">
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <p>Base Sheet ID: <strong>{SHEET_ID}</strong></p>
                    <p className="mt-1 opacity-75">Configured to sync all tabs below automatically.</p>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-3">Active Sheets (Months)</label>
                   <div className="space-y-3">
                     {config.tabs.map(tab => (
                       <div key={tab.gid} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                         <div className="flex-1 grid grid-cols-2 gap-4">
                           <div>
                             <span className="text-xs text-gray-400 uppercase font-bold">Sheet Name</span>
                             <div className="text-sm font-medium text-gray-900">{tab.name}</div>
                           </div>
                           <div>
                             <span className="text-xs text-gray-400 uppercase font-bold">GID</span>
                             <div className="font-mono text-sm text-gray-600">{tab.gid}</div>
                           </div>
                         </div>
                         <button 
                           onClick={() => handleRemoveSheet(tab.gid)}
                           className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-colors"
                           title="Remove Sheet"
                         >
                           <X size={16} />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Add New Sheet Tab</h3>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                        const gid = (form.elements.namedItem('gid') as HTMLInputElement).value;
                        if(name && gid) {
                          handleAddSheet(name, gid);
                          form.reset();
                        }
                      }}
                      className="flex gap-3"
                    >
                      <input name="name" placeholder="Name (e.g. January)" className="flex-1 px-3 py-2 border rounded-lg text-sm" required />
                      <input name="gid" placeholder="GID (e.g. 123456)" className="w-32 px-3 py-2 border rounded-lg text-sm font-mono" required />
                      <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black">Add</button>
                    </form>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          salesPersons={salesPersons}
          onClose={() => setSelectedLead(null)} 
          onUpdate={handleUpdateLead} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <ConfirmationModal
          title="Delete Lead"
          message="Are you sure you want to delete this lead? This action cannot be undone and will remove all associated notes and history."
          isDangerous={true}
          confirmText="Delete Lead"
          onCancel={() => setLeadToDelete(null)}
          onConfirm={confirmDeleteLead}
        />
      )}

      {/* AI Analysis Modal */}
      {(isAnalyzing || analysisResult) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-brand-50 to-white">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="text-brand-600 fill-brand-600" size={20} />
                  AI Lead Analysis
                </h3>
                <button onClick={() => { setAnalysisResult(null); setAnalyzingLead(null); }} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
             </div>
             
             <div className="p-6 overflow-y-auto">
               {isAnalyzing ? (
                 <div className="flex flex-col items-center justify-center py-12">
                   <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-gray-600 font-medium">Analyzing {analyzingLead?.name}...</p>
                   <p className="text-xs text-gray-400 mt-2">Checking solar potential & bill data</p>
                 </div>
               ) : (
                 <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600">
                   <div className="mb-6 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Customer</p>
                        <p className="font-semibold text-gray-900">{analyzingLead?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Monthly Bill</p>
                        <p className="font-semibold text-gray-900">{analyzingLead?.avgBill}</p>
                      </div>
                   </div>
                   <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                     {analysisResult}
                   </div>
                 </div>
               )}
             </div>

             <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
               <button 
                 onClick={() => { setAnalysisResult(null); setAnalyzingLead(null); }}
                 className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-sm transition-colors shadow-sm"
               >
                 Close Analysis
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
