import React from 'react';
import { 
  Sparkles, 
  LogOut, 
  Menu, 
  Plus, 
  ShieldCheck, 
  Database,
  User as UserIcon
} from 'lucide-react';
import { User } from '../lib/firebase';

interface NavbarProps {
  user: User;
  onSignOut: () => void;
  onNewEntry: () => void;
  onToggleSidebarMobile: () => void;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onToggleSidebarMobile,
  entryCount,
}) => {
  return (
    <header
      id="app-navbar"
      className="h-[65px] bg-[#e8eada]/90 backdrop-blur-md border-b border-[#d9d9ce] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors"
    >
      {/* Left: Mobile menu toggle + Brand */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle-btn"
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 text-[#6b725c] hover:text-[#2d3224] rounded-lg hover:bg-[#dfe2cf] transition-colors"
          title="Toggle past reflections"
          aria-label="Open past reflections sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#8c967a] text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-[#f5f5f0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-semibold text-[#2d3224] tracking-tight leading-none">
                Reflections
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[#6b725c] bg-[#f5f5f0] px-2.5 py-0.5 rounded-full border border-[#d9d9ce]">
                <Database className="w-3 h-3 text-[#8c967a]" />
                <span>Firestore Protected</span>
              </span>
            </div>
            <p className="text-[11px] text-[#8c967a] hidden sm:block mt-0.5">
              Powered by Gemini 3.6 Flash
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3">
        <button
          id="navbar-new-entry-btn"
          onClick={onNewEntry}
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-[#8c967a] text-white hover:bg-[#7b8569] px-4 py-2 rounded-full shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>

        <div className="h-6 w-px bg-[#d9d9ce] hidden sm:block" />

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-1">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User profile'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border-2 border-[#8c967a] object-cover bg-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white text-[#2d3224] flex items-center justify-center font-medium text-xs border-2 border-[#8c967a]">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-[#8c967a]" />}
            </div>
          )}

          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-[#2d3224] truncate max-w-[140px]">
              {user.displayName || 'Authenticated User'}
            </div>
            <div className="text-[10px] text-[#8c967a] truncate max-w-[140px]">
              {user.email || 'Private User Space'}
            </div>
          </div>

          <button
            id="signout-button"
            onClick={onSignOut}
            className="p-2 text-[#6b725c] hover:text-[#2d3224] rounded-lg hover:bg-[#dfe2cf] transition-colors ml-1 cursor-pointer"
            title="Sign out of your session"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
