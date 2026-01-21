import React from 'react';
import { Screen, AuthUser } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, user, onLogout }) => {
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: 'home', label: 'Início', screen: Screen.HOME, showAlways: true },
    { icon: 'calendar_month', label: 'Meus Agendamentos', screen: Screen.MY_BOOKINGS, showAlways: true },
    { icon: 'admin_panel_settings', label: 'Painel Admin', screen: Screen.ADMIN, showAlways: false, adminOnly: true },
  ];

  const visibleItems = menuItems.filter(item => item.showAlways || (item.adminOnly && isAdmin));

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-background-dark z-50 transform transition-transform shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-6 pt-8 border-b border-card-border dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">spa</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#131616] dark:text-white">BemEstar+</h2>
              <p className="text-xs text-text-muted">Sistema de Agendamentos</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-card-border dark:border-white/10 bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#131616] dark:text-white truncate">{user.nome}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase">
                  Admin
                </span>
              )}
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className="p-4 flex-1">
          {visibleItems.map((item) => (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[#131616] dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors mb-1"
            >
              <span className="material-symbols-outlined text-text-muted">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-card-border dark:border-white/10">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-medium">Sair</span>
            </button>
          )}

        </div>
      </div>
    </>
  );
};

export default Sidebar;
