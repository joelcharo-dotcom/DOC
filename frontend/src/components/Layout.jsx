import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Users, 
  FileText, 
  ClipboardList, 
  StickyNote, 
  LogOut,
  Menu,
  X,
  Stethoscope,
  Settings,
  Receipt,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import ConfiguracionUsuarios from './ConfiguracionUsuarios';

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/historias', icon: FileText, label: 'Historias' },
    { path: '/formulas', icon: ClipboardList, label: 'Fórmulas' },
    { path: '/facturas', icon: Receipt, label: 'Facturas' },
    { path: '/contabilidad', icon: Wallet, label: 'Contabilidad' },
    { path: '/notas', icon: StickyNote, label: 'Notas' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg fixed w-full z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <Stethoscope size={28} />
              <span className="text-xl font-bold hidden sm:block">FUNDAMUFA</span>
            </div>
          </div>
          
          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? 'bg-white text-blue-800' 
                      : 'hover:bg-blue-700 text-white'
                  }`
                }
              >
                {item.label.toUpperCase()}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm">
              Hola, <strong>{usuario?.nombre}</strong>
            </span>
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title="Configuración de usuarios"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl pt-16">
            <nav className="p-4 space-y-2">
              {menuItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:block fixed left-0 top-14 h-full w-56 bg-white shadow-lg pt-4">
        <nav className="p-4 space-y-2">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-20 left-0 right-0 p-4 text-center text-xs text-gray-500">
          <p>Sistema Médico</p>
          <p className="font-semibold text-blue-700">FUNDAMUFA 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-14 lg:pl-56 min-h-screen">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Modal de Configuración */}
      {showConfig && (
        <ConfiguracionUsuarios onClose={() => setShowConfig(false)} />
      )}
    </div>
  );
}
