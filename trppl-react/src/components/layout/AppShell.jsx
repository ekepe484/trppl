// src/components/layout/AppShell.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { notificationsApi } from '../../lib/api';

const TABS = [
  { id: 'discover',  label: 'Discover', icon: 'ti-flame'  },
  { id: 'notifs',    label: 'Alerts',   icon: 'ti-bell'   },
  { id: 'trppl',     label: 'Trppl',    icon: 'ti-users'  },
  { id: 'games',     label: 'Games',    icon: 'ti-chess'  },
  { id: 'waiting',   label: 'Waiting',  icon: 'ti-clock'  },
];

export function AppShell({ children, activeTab, onTabChange }) {
  const navigate    = useNavigate();
  const user        = useAuthStore(s => s.user);
  const unreadCount = useAppStore(s => s.unreadCount);
  const setNotifs   = useAppStore(s => s.setNotifications);
  const markAllRead = useAppStore(s => s.markAllRead);

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 60000);
    return () => clearInterval(t);
  }, []);

  async function loadNotifications() {
    try {
      const { data } = await notificationsApi.getAll();
      setNotifs(data.notifications || []);
    } catch {}
  }

  async function handleTabChange(tab) {
    onTabChange(tab);
    if (tab === 'notifs' && unreadCount > 0) {
      markAllRead();
      try { await notificationsApi.markAllRead(); } catch {}
    }
  }

  const initial = (user?.name || user?.username || 'A')[0].toUpperCase();

  return (
    <div className="phone">
      {/* Status bar */}
      <div className="bg-[#1a1a2e] px-5 py-3.5 flex justify-between items-center text-xs text-white/70 flex-shrink-0">
        <span id="clk">{new Date().getHours()}:{String(new Date().getMinutes()).padStart(2,'0')}</span>
        <span className="flex gap-1.5">
          <i className="ti ti-wifi" />
          <i className="ti ti-battery" />
        </span>
      </div>

      {/* Nav */}
      <div className="bg-[#1a1a2e] px-4 pb-3.5 flex items-center justify-between flex-shrink-0">
        <Logo size="sm" />
        <button onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-base cursor-pointer">
          {initial}
          {user?.profileVerified && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#1a1a2e] flex items-center justify-center">
              <i className="ti ti-check text-[7px] text-white" />
            </span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <nav className="flex bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-700 flex-shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={`tab-btn relative ${activeTab === t.id ? 'active' : ''}`}>
            <span className="relative">
              <i className={`ti ${t.icon} text-xl`} />
              {t.id === 'notifs' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="screen-scroll">
        {children}
      </div>
    </div>
  );
}
