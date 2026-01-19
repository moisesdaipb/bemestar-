import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, isAdmin = false, isSuperAdmin = false }) => {
  const navItems = [
    { icon: 'home', label: 'Início', screen: Screen.HOME, showForUser: true, showForAdmin: true, showForSuperAdmin: false },
    { icon: 'calendar_month', label: 'Agendamentos', screen: Screen.MY_BOOKINGS, showForUser: true, showForAdmin: true, showForSuperAdmin: false },
    { icon: 'admin_panel_settings', label: 'Admin', screen: Screen.ADMIN, showForUser: false, showForAdmin: true, showForSuperAdmin: false },
    { icon: 'domain', label: 'Empresas', screen: Screen.SUPER_ADMIN, showForUser: false, showForAdmin: false, showForSuperAdmin: true },
  ];

  const visibleItems = navItems.filter(item => {
    if (isSuperAdmin) return item.showForSuperAdmin;
    if (isAdmin) return item.showForUser || item.showForAdmin;
    return item.showForUser;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-card-border dark:border-white/10 z-40 max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-4">
        {visibleItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${isActive
                ? 'text-primary'
                : 'text-text-muted hover:text-[#131616] dark:hover:text-white'
                }`}
            >
              <span className={`material-symbols-outlined text-[26px] ${isActive ? 'text-primary' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
