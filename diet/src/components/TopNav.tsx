import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDiet } from '../context/DietContext';
import {
  Flame,
  Plus,
  User,
  LogOut,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Sliders,
  Trash2,
  Cloud,
} from 'lucide-react';

interface TopNavProps {
  onOpenMealLogger: () => void;
  onOpenProfile: () => void;
  onOpenBackup: () => void;
  activeSection: string;
  setActiveSection: (sec: 'dashboard' | 'meals' | 'database' | 'analytics') => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMealLogger,
  onOpenProfile,
  onOpenBackup,
  activeSection,
  setActiveSection,
}) => {
  const { currentUser, users, switchUser, logout, firebaseUser, signInWithGoogle } = useAuth();
  const { selectedDate, setSelectedDate, jumpToToday, prevDay, nextDay } = useDiet();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isToday =
    selectedDate === new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 shadow-sm">
            <Flame className="w-4 h-4 fill-zinc-950 stroke-[2.2]" />
          </div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
            className="text-sm font-bold tracking-tight text-white hover:text-zinc-300 transition-colors"
          >
            AstraDiet
          </a>
        </div>

        {/* Clean Text Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`transition-colors hover:text-white cursor-pointer ${
              activeSection === 'dashboard' ? 'text-white font-semibold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSection('meals')}
            className={`transition-colors hover:text-white cursor-pointer ${
              activeSection === 'meals' ? 'text-white font-semibold' : ''
            }`}
          >
            Meals
          </button>
          <button
            onClick={() => setActiveSection('analytics')}
            className={`transition-colors hover:text-white cursor-pointer ${
              activeSection === 'analytics' ? 'text-white font-semibold' : ''
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setActiveSection('database')}
            className={`transition-colors hover:text-white cursor-pointer ${
              activeSection === 'database' ? 'text-white font-semibold' : ''
            }`}
          >
            Food Library
          </button>
          <button
            onClick={onOpenBackup}
            className="transition-colors hover:text-white cursor-pointer"
          >
            Sync / Backup
          </button>
        </nav>

        {/* Action Controls & User */}
        <div className="flex items-center gap-2.5">
          {/* Quick Date Switcher */}
          <div className="hidden sm:flex items-center rounded-lg bg-zinc-900 border border-white/[0.08] p-0.5 text-xs">
            <button
              onClick={prevDay}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={jumpToToday}
              className={`px-2 py-0.5 font-mono text-[11px] font-medium rounded transition-colors ${
                isToday ? 'text-white font-bold bg-zinc-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isToday ? 'Today' : selectedDate}
            </button>
            <button
              onClick={nextDay}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Next day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* "+ Log Meal" Action */}
          <button
            onClick={onOpenMealLogger}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Log Meal</span>
          </button>

          {/* User Profile Menu */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-zinc-900/90 p-1 pr-2 hover:border-white/[0.16] transition-all text-xs text-zinc-200 cursor-pointer"
              >
                <div className="h-6 w-6 rounded bg-zinc-800 border border-white/[0.08] flex items-center justify-center font-bold text-white text-[11px]">
                  {currentUser.name[0]}
                </div>
                <span className="hidden md:inline max-w-[90px] truncate text-xs font-medium">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/[0.1] bg-[#121215] p-2 shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-white/[0.08]">
                    <div className="font-semibold text-white text-xs truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {currentUser.email}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Target: {currentUser.targets.calories} kcal ·{' '}
                      {currentUser.goal.replace('_', ' ')}
                    </div>
                    {firebaseUser ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold mt-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5 w-fit">
                        <Cloud className="w-3 h-3" />
                        <span>Cloud Sync Active</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signInWithGoogle();
                        }}
                        className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold mt-1.5 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 w-fit hover:bg-amber-500/20 transition-colors cursor-pointer"
                        title="Link Google account to sync all data across mobile and desktop"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>Connect Google Sync</span>
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                      Adjust Biometrics & Targets
                    </button>
                  </div>

                  <div className="border-t border-white/[0.08] pt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Delete User Profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
