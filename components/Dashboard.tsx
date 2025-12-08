import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Lead, DashboardMetrics } from '../types';
import { FileText, MapPin, IndianRupee, TrendingUp, Calendar, Clock, Phone, Bell } from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  metrics: DashboardMetrics;
}

const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC<DashboardProps> = ({ leads, metrics }) => {
  
  // Specific counters for the requested cards
  const quoteCount = leads.filter(l => l.status === 'Quotation sent').length;
  const visitCount = leads.filter(l => l.status === 'Site visit').length;
  const advanceCount = leads.filter(l => l.status === 'Advance payment').length;

  const total = leads.length || 1; // avoid divide by zero

  const chartData = [
    { name: 'Quotation', value: quoteCount },
    { name: 'Site Visit', value: visitCount },
    { name: 'Advance', value: advanceCount },
    { name: 'Others', value: leads.length - (quoteCount + visitCount + advanceCount) }
  ].filter(d => d.value > 0);

  // Calculate Upcoming Reminders (Next 7 Days)
  const upcomingReminders = leads.filter(lead => {
    if (!lead.nextReminder) return false;
    const reminderDate = new Date(lead.nextReminder);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    // Check if valid date and within range (future but < 7 days)
    // We allow reminders from slightly in the past (today) to show up as "due"
    const isFutureOrToday = reminderDate.getTime() >= now.getTime() - (24 * 60 * 60 * 1000); 
    return isFutureOrToday && reminderDate <= sevenDaysFromNow;
  }).sort((a, b) => new Date(a.nextReminder!).getTime() - new Date(b.nextReminder!).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
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
           <p className="text-xs text-gray-400 mt-2">{Math.round((quoteCount/total)*100)}% of total leads</p>
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
           <p className="text-xs text-gray-400 mt-2">{Math.round((visitCount/total)*100)}% of total leads</p>
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
           <p className="text-xs text-gray-400 mt-2">{Math.round((advanceCount/total)*100)}% of total leads</p>
        </div>
      </div>

      {/* Middle Row - Large Colored Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Blue Card */}
        <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                 <FileText size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold">Quotation sent</h3>
           </div>
           <p className="text-blue-100 text-sm">{quoteCount} leads</p>
           <div className="mt-8 text-center text-blue-200 text-xs font-medium">
              {quoteCount === 0 ? "No leads in this status" : "View Details ->"}
           </div>
        </div>

        {/* Green Card */}
        <div className="bg-green-600 rounded-xl p-6 text-white shadow-lg shadow-green-200">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                 <MapPin size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold">Site visit</h3>
           </div>
           <p className="text-green-100 text-sm">{visitCount} leads</p>
           <div className="mt-8 text-center text-green-200 text-xs font-medium">
              {visitCount === 0 ? "No leads in this status" : "View Details ->"}
           </div>
        </div>

        {/* Purple Card */}
        <div className="bg-purple-600 rounded-xl p-6 text-white shadow-lg shadow-purple-200">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                 <IndianRupee size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold">Advance payment</h3>
           </div>
           <p className="text-purple-100 text-sm">{advanceCount} leads</p>
           <div className="mt-8 text-center text-purple-200 text-xs font-medium">
              {advanceCount === 0 ? "No leads in this status" : "View Details ->"}
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
            <span className="bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
              Next 7 Days
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {upcomingReminders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Calendar size={48} className="mb-2 opacity-20" />
                <p className="text-sm">No reminders scheduled for this week.</p>
              </div>
            ) : (
              upcomingReminders.map(lead => (
                <div key={lead.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-brand-200 transition-colors">
                   <div className="bg-white p-2 rounded-lg text-center min-w-[60px] border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase">{new Date(lead.nextReminder!).toLocaleString('default', { month: 'short' })}</p>
                      <p className="text-xl font-bold text-brand-600">{new Date(lead.nextReminder!).getDate()}</p>
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <h4 className="font-bold text-gray-900 truncate">{lead.name}</h4>
                         <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500">
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
                        <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pipeline Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Pipeline Distribution</h3>
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No data to display
            </div>
          )}
        </div>

      </div>

    </div>
  );
};