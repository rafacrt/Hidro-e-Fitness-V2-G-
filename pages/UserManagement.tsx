import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Key,
  Check,
  X
} from 'lucide-react';
import { User as UserType } from '../types';
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MANAGER' as 'DEV' | 'MANAGER'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Always blank on edit for security
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'MANAGER' });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        await deleteUser(id);
        await loadUsers();
      } catch (error) {
        alert('Erro ao remover usuário');
        console.error(error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Edit Logic
        const updateData: Partial<UserType> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateUser(editingUser.id, updateData);
      } else {
        // Create Logic
        const newUser: Partial<UserType> = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
        };
        await createUser(newUser);
      }
      await loadUsers();
      setShowModal(false);
    } catch (error) {
      alert('Erro ao salvar usuário');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-primary-600" />
            Gestão de Acesso
          </h2>
          <p className="text-slate-500 text-sm">Gerencie quem tem acesso ao sistema (Restrito ao Desenvolvedor).</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200"
        >
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Usuário</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Cargo</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                    <span className="font-medium text-slate-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                      ${user.role === 'DEV' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role === 'DEV' ? 'DESENVOLVEDOR' : 'GERENTE'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openModal(user)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Editar / Alterar Senha">
                      <Edit2 size={18} />
                    </button>
                    {user.role !== 'DEV' && (
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remover">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                  {loading ? 'Carregando...' : 'Nenhum usuário encontrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="******"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Permissão</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                >
                  <option value="MANAGER">Gerente (Padrão)</option>
                  <option value="DEV">Desenvolvedor (Acesso Total)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;