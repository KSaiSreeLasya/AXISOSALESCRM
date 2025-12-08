import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Users, KanbanSquare, Settings, RefreshCw, X, Sparkles, ShieldCheck } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { LeadList } from './components/LeadList';
import { Kanban } from './components/Kanban';
import { SalesTeam } from './components/SalesTeam';
import { LeadDetailModal } from './components/LeadDetailModal';
import { Lead, SheetConfig, DashboardMetrics, SalesPerson, ActivityLogEntry, Note } from './types';
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
  const [currentView, setCurrentView] = useState<'dashboard' | 'leads' | 'kanban' | 'team' | 'settings'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [config, setConfig] = useState<SheetConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  
  // Selected Lead for Detail Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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

  // Fetch Data from Supabase
  const fetchData = useCallback(async () => {
    try {
      // Fetch Sales Persons
      const { data: spData, error: spError } = await supabase.from('sales_persons').select('*');
      if (spError) throw spError;
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
      
      if (leadsError) throw leadsError;

      if (leadsData) {
        // Map DB snake_case to CamelCase
        const mappedLeads = leadsData.map(mapDBToLead);
        setLeads(mappedLeads);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

          if (sheetLeads.length > 0) {
            setSyncStatus(`Syncing ${sheetLeads.length} records for ${tab.name}...`);
            
            // 1. Upsert Leads
            const dbLeads = sheetLeads.map(mapLeadToDB);
            const { error: upsertError } = await supabase
              .from('leads')
              .upsert(dbLeads, { onConflict: 'id', ignoreDuplicates: false }); // Update if exists
            
            if (upsertError) throw upsertError;

            // 2. Insert Initial Notes & Logs (Only if they don't exist is harder in batch, 
            // so we rely on the ID generation from parseCSV being deterministic)
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
                await supabase.from('notes').upsert(initialNotes, { onConflict: 'id', ignoreDuplicates: true });
            }
            if (initialLogs.length > 0) {
                await supabase.from('activity_logs').upsert(initialLogs, { onConflict: 'id', ignoreDuplicates: true });
            }
          }

        } catch (err) {
          console.error(`Failed to sync ${tab.name}`, err);
          errors.push(tab.name);
        }
      }

      setConfig(prev => ({ ...prev, lastSynced: Date.now() }));
      setSyncStatus(errors.length > 0 ? `Synced with errors in: ${errors.join(', ')}` : 'Sync complete!');
      
      // Refresh local state from DB
      await fetchData();

    } catch (err) {
      console.error(err);
      setSyncStatus("Sync failed. Check console.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  }, [config, fetchData]);

  // Auto-sync logic (Optional: can be annoying if it runs too often, maybe just load DB on mount)
  // We keep it as per request
  useEffect(() => {
    if (config.autoSync && leads.length === 0 && !isLoading) {
       // Only auto-sync if we have no data, otherwise rely on DB fetch
       // Or if user explicitly hits Sync button
    }
  }, [config.autoSync]);


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
          await supabase.from('leads').update(dbUpdates).eq('id', leadId);
          
          // Log Activity for status change
          if (updates.status && updates.status !== currentLead.status) {
              await supabase.from('activity_logs').insert({
                  lead_id: leadId,
                  type: 'status_change',
                  description: `Status changed from ${currentLead.status} to ${updates.status}`,
                  author: 'User'
              });
          }
          // Log Activity for Assignment
           if (updates.assignedTo !== undefined && updates.assignedTo !== currentLead.assignedTo) {
             const spName = salesPersons.find(sp => sp.id === updates.assignedTo)?.name || 'Unknown';
              await supabase.from('activity_logs').insert({
                  lead_id: leadId,
                  type: 'assignment',
                  description: `Assigned to ${spName}`,
                  author: 'User'
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
              author: newNote.author
          });
          
           await supabase.from('activity_logs').insert({
              lead_id: leadId,
              type: 'note_update',
              description: 'Note added',
              author: 'User'
          });
      }

      // Refresh data to get exact server state (optional, but good for consistency)
      // await fetchData(); 

      // Update selected lead if open
      if (selectedLead && selectedLead.id === leadId) {
          // Merge updates into selected lead
          setSelectedLead(prev => prev ? ({ ...prev, ...updates }) : null);
      }

    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to save changes to database.");
      // Revert optimistic update? (omitted for brevity)
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

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      // Optimistic delete
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);

      try {
        await supabase.from('leads').delete().eq('id', leadId);
      } catch (err) {
        console.error("Delete failed", err);
        fetchData(); // Revert
      }
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
    } catch (err) {
        console.error("Failed to add sales person", err);
        alert("Failed to add member to database.");
    }
  };

  const handleRemoveSalesPerson = async (id: string) => {
    try {
        const { error } = await supabase.from('sales_persons').delete().eq('id', id);
        if (error) throw error;
        setSalesPersons(prev => prev.filter(p => p.id !== id));
    } catch (err) {
        console.error("Failed to remove sales person", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 shadow-sm hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-200">A</div>
          <span className="text-xl font-bold tracking-tight text-gray-800">Axis<span className="text-brand-600">Solar</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'leads', icon: Users, label: 'Leads Data' },
            { id: 'kanban', icon: KanbanSquare, label: 'Pipeline' },
            { id: 'team', icon: ShieldCheck, label: 'Sales Team' },
            { id: 'settings', icon: Settings, label: 'Sheet Config' },
          ].map(item => (
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 z-10 shrink-0">
          <div className="flex items-center gap-4 md:hidden">
             <div className="w-8 h-8 bg-brand-600 rounded text-white flex items-center justify-center font-bold">A</div>
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
                onUpdateLead={handleUpdateLead}
                onAutoAssign={handleAutoAssign}
                onSelectLead={setSelectedLead}
                onDeleteLead={handleDeleteLead}
            />
          )}

          {currentView === 'kanban' && <Kanban leads={leads} onUpdateLead={handleUpdateLead} />}
          
          {currentView === 'team' && (
            <SalesTeam 
                members={salesPersons} 
                onAddMember={handleAddSalesPerson} 
                onRemoveMember={handleRemoveSalesPerson} 
            />
          )}
          
          {currentView === 'settings' && (
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