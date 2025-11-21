import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Droplets, 
  Wallet, 
  Server, 
  Menu, 
  X, 
  Bell,
  LogOut,
  Calendar,
  Shield,
  Key,
  FileBarChart
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user?: User;
  onLogout?: () => void;
}

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
        : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-primary-600'} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Sua senha foi alterada com sucesso!');
    setNewPassword('');
    setShowProfileModal(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-xl tracking-tight">
            <div className="p-1.5 bg-primary-600 rounded-lg">
              <Droplets size={20} className="text-white" />
            </div>
            HidroFitness
          </div>
          <button onClick={toggleSidebar} className="ml-auto lg:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Principal</div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
          <SidebarItem icon={Users} label="Alunos" to="/students" active={location.pathname === '/students'} />
          <SidebarItem icon={Calendar} label="Planos e Turmas" to="/classes" active={location.pathname === '/classes'} />
          
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-8 mb-4 px-4">Gestão</div>
          <SidebarItem icon={Wallet} label="Financeiro" to="/finance" active={location.pathname === '/finance'} />
          <SidebarItem icon={FileBarChart} label="Relatórios" to="/reports" active={location.pathname === '/reports'} />
          
          {/* DEV ONLY MODULES */}
          {user?.role === 'DEV' && (
            <>
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mt-8 mb-4 px-4">Área do Desenvolvedor</div>
              <SidebarItem icon={Shield} label="Usuários" to="/users" active={location.pathname === '/users'} />
              <SidebarItem icon={Server} label="Arquitetura & SQL" to="/architecture" active={location.pathname === '/architecture'} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div 
            className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setShowProfileModal(true)}
          >
            <img 
              src={user?.avatar || "https://ui-avatars.com/api/?name=User"} 
              alt="User" 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate uppercase">{user?.role === 'DEV' ? 'Desenvolvedor' : 'Gerente'}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onLogout?.(); }}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="text-slate-500 lg:hidden hover:text-slate-700">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
              {location.pathname === '/' ? 'Visão Geral' : 
               location.pathname === '/students' ? 'Gestão de Alunos' :
               location.pathname === '/classes' ? 'Planos e Turmas' :
               location.pathname === '/users' ? 'Gestão de Usuários' :
               location.pathname === '/reports' ? 'Relatórios Gerenciais' :
               location.pathname === '/architecture' ? 'Arquitetura do Sistema' : 'Sistema'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Profile/Password Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Meu Perfil</h3>
                <button onClick={() => setShowProfileModal(false)}><X size={24} className="text-slate-400" /></button>
             </div>
             <div className="p-6 text-center border-b border-slate-100">
                <img src={user?.avatar} className="w-20 h-20 rounded-full mx-auto mb-3" />
                <h4 className="font-bold text-lg">{user?.name}</h4>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600">{user?.email}</span>
             </div>
             <form onSubmit={handleChangePassword} className="p-6 bg-slate-50/50 rounded-b-xl">
                <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                   <Key size={16} /> Alterar Minha Senha
                </h5>
                <div className="space-y-3">
                   <input 
                      type="password" 
                      placeholder="Nova Senha"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                   />
                   <button 
                      type="submit" 
                      disabled={!newPassword}
                      className="w-full py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      Atualizar Senha
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;