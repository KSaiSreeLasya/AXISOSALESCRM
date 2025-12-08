import React, { useState } from 'react';
import { Plus, User as UserIcon, Mail, Phone, Lock, Trash2, ShieldCheck, Pencil, X } from 'lucide-react';
import { SalesPerson, User } from '../types';

interface SalesTeamProps {
  currentUser: User;
  members: SalesPerson[];
  onAddMember: (member: SalesPerson) => void;
  onRemoveMember: (id: string) => void;
  onUpdateMember: (id: string, updates: Partial<SalesPerson>) => void;
}

export const SalesTeam: React.FC<SalesTeamProps> = ({ currentUser, members, onAddMember, onRemoveMember, onUpdateMember }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<SalesPerson | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const [editData, setEditData] = useState({
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

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember && editData.name && editData.email) {
      onUpdateMember(editingMember.id, {
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
        password: editData.password
      });
      setEditingMember(null);
    }
  };

  const openEdit = (member: SalesPerson) => {
    setEditingMember(member);
    setEditData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      password: member.password || ''
    });
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="text-brand-600" size={24} />
            Sales Team Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
             {isAdmin ? 'Manage access and assign leads to your team.' : 'View team members and update your profile.'}
          </p>
        </div>
        
        {/* Only Admin can add new users */}
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Add Sales Person
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Form (Admin Only) */}
        {isAdding && isAdmin && (
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">New Team Member</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
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
        <div className={isAdding && isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {members.length === 0 ? (
               <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <UserIcon size={48} className="mx-auto mb-2 opacity-50" />
                 <p>No sales persons added yet.</p>
               </div>
            ) : (
              members.map(member => {
                // Permission Checks
                const canDelete = isAdmin;
                // Can edit if Admin OR if it's their own profile
                const canEdit = isAdmin || currentUser.id === member.id;

                return (
                  <div key={member.id} className={`bg-white border rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow group relative ${currentUser.id === member.id ? 'border-brand-200 ring-1 ring-brand-100' : 'border-gray-200'}`}>
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 truncate pr-6">{member.name}</h3>
                        {currentUser.id === member.id && (
                           <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-bold">YOU</span>
                        )}
                      </div>
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
                    
                    <div className="absolute top-4 right-4 flex gap-1">
                      {canEdit && (
                        <button 
                          onClick={() => openEdit(member)}
                          className="text-gray-300 hover:text-brand-600 p-1 transition-colors"
                          title="Edit Details"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      
                      {canDelete && (
                        <button 
                          onClick={() => onRemoveMember(member.id)}
                          className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6 animate-in zoom-in-50 duration-200">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-800 text-lg">Edit Sales Person</h3>
                 <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                    value={editData.name}
                    onChange={e => setEditData({...editData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                  <input 
                    required
                    type="email" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                    value={editData.email}
                    onChange={e => setEditData({...editData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                    value={editData.phone}
                    onChange={e => setEditData({...editData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm font-mono"
                    value={editData.password}
                    onChange={e => setEditData({...editData, password: e.target.value})}
                  />
                </div>
                <div className="pt-2 flex gap-3">
                   <button type="submit" className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-brand-700">Update</button>
                   <button type="button" onClick={() => setEditingMember(null)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
