import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Compass, PenSquare, User } from 'lucide-react';

const tabs = [
  { key: 'explore', label: 'Explore', icon: Compass, path: '/' },
  { key: 'workspace', label: 'Draw', icon: PenSquare, path: '/canvas?focus=1' },
  { key: 'profile', label: 'Profile', icon: User, path: '/dashboard' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleNavigate = (tab) => {
    if (tab.key === 'workspace' || tab.key === 'profile') {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
    }
    navigate(tab.path);
  };

  const activeKey = (() => {
    if (location.pathname.startsWith('/canvas')) return 'workspace';
    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/home')) return 'profile';
    return 'explore';
  })();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-gray-950/95 border-t border-gray-800 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleNavigate(tab)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 text-xs ${
                active
                  ? 'text-cyan-400'
                  : 'text-gray-400 hover:text-cyan-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                  active
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.45)]'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

