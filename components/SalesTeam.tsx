import React, { useState } from 'react';
import { Plus, User, Mail, Phone, Lock, Trash2, ShieldCheck } from 'lucide-react';
import { SalesPerson } from '../types';

interface SalesTeamProps {
  members: SalesPerson[];
  onAddMember: (member: SalesPerson) => void;
  onRemoveMember: (id: string) => void;
}

export const SalesTeam: React.FC<SalesTeamProps> = ({ members, onAddMember, onRemoveMember }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      onAddMember({
        id: `sp-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        active: true
      });
      setFormData({ name: '', email: '', phone: '', password: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="text-brand-600" size={24} />
            Sales Team Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage access and assign leads to your team.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add Sales Person
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Form */}
        {isAdding && (
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">New Team Member</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="tel" 
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-brand-700">Save Member</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        <div className={isAdding ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {members.length === 0 ? (
               <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <User size={48} className="mx-auto mb-2 opacity-50" />
                 <p>No sales persons added yet.</p>
               </div>
            ) : (
              members.map(member => (
                <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow group relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{member.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 truncate">
                      <Mail size={12} /> {member.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <Phone size={12} /> {member.phone}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">Active</span>
                       <span className="text-[10px] text-gray-400">ID: {member.id.slice(-6)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveMember(member.id)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};