
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Lead, DashboardMetrics, SheetTab } from '../types';
import { FileText, MapPin, IndianRupee, TrendingUp, Calendar, Clock, Phone, Bell, Filter } from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  sheetTabs: SheetTab[];
  metrics: DashboardMetrics;
}

// Colors aligned with the provided visual: Purple for others, Blue for quotation, Green for site visit.
const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC<DashboardProps> = ({ leads, sheetTabs, metrics: globalMetrics }) => {
  // Get current calendar month name
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('en-US', { month: 'long' });
  }, []);

  // Default to the current month if it's in the sheets, otherwise "All" or the first sheet
  const defaultMonth = useMemo(() => {
    const hasCurrent = sheetTabs.some(t => t.name.toLowerCase() === currentMonthName.toLowerCase());
    return hasCurrent ? currentMonthName : (sheetTabs.length > 0 ? sheetTabs[0].name : 'All');
  }, [sheetTabs, currentMonthName]);

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  // Filtered leads based on selection
  const filteredLeads = useMemo(() => {
    if (selectedMonth === 'All') return leads;
    return leads.filter(l => l.sheetName.toLowerCase() === selectedMonth.toLowerCase());
  }, [leads, selectedMonth]);

  // Specific counters for the requested cards based on filtered data
  const quoteCount = filteredLeads.filter(l => l.status === 'Quotation sent').length;
  const visitCount = filteredLeads.filter(l => l.status.toLowerCase().includes('site visit')).length;
  const advanceCount = filteredLeads.filter(l => l.status === 'Advance payment').length;

  const total = filteredLeads.length || 1;

  const chartData = [
    { name: 'Quotation', value: quoteCount },
    { name: 'Site Visit', value: visitCount },
    { name: 'Advance', value: advanceCount },
    { name: 'Others', value: filteredLeads.length - (quoteCount + visitCount + advanceCount) }
  ].filter(d => d.value > 0);

  // Calculate Upcoming Reminders (Next 7 Days) - Always show from all active leads or just current month?
  // Usually reminders are global, but we'll stick to filtered for consistency with "current month" requirement
  const upcomingReminders = filteredLeads.filter(lead => {
    if (!lead.nextReminder) return false;
    const reminderDate = new Date(lead.nextReminder);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    const isFutureOrToday = reminderDate.getTime() >= now.getTime() - (24 * 60 * 60 * 1000); 
    return isFutureOrToday && reminderDate <= sevenDaysFromNow;
  }).sort((a, b) => new Date(a.nextReminder!).getTime() - new Date(b.nextReminder!).getTime());

  const availableMonths = useMemo(() => {
    return ['All', ...sheetTabs.map(t => t.name)];
  }, [sheetTabs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Dashboard Filter Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
           <Filter size={18} className="text-brand-600" />
           <span className="text-sm font-bold text-gray-700">Displaying Data for:</span>
           <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
             <select 
               className="pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white font-medium text-gray-700 appearance-none cursor-pointer"
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
             >
               {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
           </div>
        </div>
        <div className="text-xs text-gray-400 italic">
          Total Leads in {selectedMonth}: <strong>{filteredLeads.length}</strong>
        </div>
      </div>

      {/* Top Row - Metric Cards with Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Quotation Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-sm text-gray-500 font-medium">Quotation sent</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-1">{quoteCount}</h3>
             </div>
             <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
               <TrendingUp size={20} />
             </div>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
             <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(quoteCount/total)*100}%` }}></div>
           </div>
           <p className="text-xs text-gray-400 mt-2">{Math.round((quoteCount/total)*100)}% of month total</p>
        </div>

        {/* Site Visit Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-sm text-gray-500 font-medium">Site visit</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-1">{visitCount}</h3>
             </div>
             <div className="p-2 bg-green-50 text-green-500 rounded-lg">
               <TrendingUp size={20} />
             </div>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
             <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(visitCount/total)*100}%` }}></div>
           </div>
           <p className="text-xs text-gray-400 mt-2">{Math.round((visitCount/total)*100)}% of month total</p>
        </div>

        {/* Advance Payment Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-sm text-gray-500 font-medium">Advance payment</p>
               <h3 className="text-3xl font-bold text-gray-900 mt-1">{advanceCount}</h3>
             </div>
             <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
               <TrendingUp size={20} />
             </div>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
             <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(advanceCount/total)*100}%` }}></div>
           </div>
           <p className="text-xs text-gray-400 mt-2">{Math.round((advanceCount/total)*100)}% of month total</p>
        </div>
      </div>

      {/* Middle Row - Large Colored Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Blue Card */}
        <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200 transition-transform hover:scale-[1.02]">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                 <FileText size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold">Quotation sent</h3>
           </div>
           <p className="text-blue-100 text-sm">{quoteCount} leads this month</p>
           <div className="mt-8 text-center text-blue-200 text-xs font-medium uppercase tracking-wider">
              {quoteCount === 0 ? "No active leads" : "Active Pipeline"}
           </div>
        </div>

        {/* Green Card */}
        <div className="bg-green-600 rounded-xl p-6 text-white shadow-lg shadow-green-200 transition-transform hover:scale-[1.02]">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                 <MapPin size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold">Site visit</h3>
           </div>
           <p className="text-green-100 text-sm">{visitCount} leads this month</p>
           <div className="mt-8 text-center text-green-200 text-xs font-medium uppercase tracking-wider">
              {visitCount === 0 ? "No visits scheduled" : "Conversion Focus"}
           </div>
        </div>

        {/* Purple Card */}
        <div className="bg-purple-600 rounded-xl p-6 text-white shadow-lg shadow-purple-200 transition-transform hover:scale-[1.02]">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                 <IndianRupee size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold">Advance payment</h3>
           </div>
           <p className="text-purple-100 text-sm">{advanceCount} leads this month</p>
           <div className="mt-8 text-center text-purple-200 text-xs font-medium uppercase tracking-wider">
              {advanceCount === 0 ? "Pending deposits" : "Secured Business"}
           </div>
        </div>
      </div>

      {/* Bottom Row: Reminders & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Reminders Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Bell className="text-brand-600" size={20} />
              Upcoming Reminders
            </h3>
            <span className="bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              Scheduled
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {upcomingReminders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Calendar size={48} className="mb-2 opacity-20" />
                <p className="text-sm">No reminders in {selectedMonth} for this period.</p>
              </div>
            ) : (
              upcomingReminders.map(lead => (
                <div key={lead.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-brand-200 transition-colors">
                   <div className="bg-white p-2 rounded-lg text-center min-w-[60px] border border-gray-200 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(lead.nextReminder!).toLocaleString('default', { month: 'short' })}</p>
                      <p className="text-xl font-bold text-brand-600 leading-none mt-1">{new Date(lead.nextReminder!).getDate()}</p>
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <h4 className="font-bold text-gray-900 truncate">{lead.name}</h4>
                         <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500 font-bold uppercase">
                           {lead.sheetName}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock size={12} />
                        <span className={new Date(lead.nextReminder!) < new Date() ? "text-red-500 font-semibold" : ""}>
                          {new Date(lead.nextReminder!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                        <Phone size={12} />
                        <a href={`tel:${lead.phone}`} className="hover:underline font-medium">{lead.phone}</a>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Pipeline Distribution</h3>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Current Filter: {selectedMonth}</div>
          </div>
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => {
                      // Custom mapping to match the provided visual exactly
                      let color = COLORS[index % COLORS.length];
                      if (entry.name === 'Others') color = '#a855f7'; // Purple
                      if (entry.name === 'Quotation') color = '#3b82f6'; // Blue
                      if (entry.name === 'Site Visit') color = '#10b981'; // Green
                      if (entry.name === 'Advance') color = '#f59e0b'; // Amber
                      
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="rect" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
              No pipeline data for {selectedMonth}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
