import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Lead, DashboardMetrics } from '../types';
import { FileText, MapPin, IndianRupee, TrendingUp } from 'lucide-react';

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

      {/* Empty State / Bottom Area */}
      <div className="bg-blue-50/50 rounded-xl p-8 border border-blue-100 text-center">
         <p className="text-gray-500 mb-2">
           {quoteCount + visitCount + advanceCount === 0 
             ? "No leads in Quotation sent, Site visit, or Advance payment statuses yet."
             : "Your pipeline is active. Check the Kanban board to manage these deals."
           }
         </p>
         <p className="text-xs text-gray-400">Leads will appear here once you move them to these stages.</p>
      </div>

      {/* Pipeline Chart */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Distribution</h3>
          <div className="h-64">
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
        </div>

    </div>
  );
};