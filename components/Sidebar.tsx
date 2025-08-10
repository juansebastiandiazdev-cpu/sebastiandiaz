
import React from 'react';
import {
  LayoutDashboardIcon, UsersIcon, ListIcon, LogOutIcon, UserIcon, BarChartIcon, BookOpenIcon, DatabaseIcon, AwardIcon, ClipboardCheckIcon, ChevronsLeftIcon, WorkflowIcon, SolvoLogoIcon
} from './Icons';
import { View, TeamMember } from '../types';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, isCollapsed }) => (
  <button
    type="button"
    title={isCollapsed ? label : undefined}
    onClick={onClick}
    className={`relative flex items-center text-sm font-medium rounded-md transition-all duration-200 group
      ${isCollapsed ? 'justify-center h-11 w-11' : 'px-3 py-2.5'}
      ${active
        ? 'bg-core-accent-light text-core-accent'
        : 'text-core-text-secondary hover:bg-core-bg-soft hover:text-core-text-primary'
    }`}
  >
    {active && !isCollapsed && <div className="absolute left-0 top-2 bottom-2 w-1 bg-core-accent rounded-r-full"></div>}
    <span className={`transition-transform duration-200 group-hover:scale-110 ${isCollapsed ? '' : 'mr-3'}`}>{icon}</span>
    <span className={`${isCollapsed ? 'sr-only' : 'whitespace-nowrap'}`}>{label}</span>
    {active && isCollapsed && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-core-accent rounded-full"></div>}
  </button>
);

interface SidebarProps {
    user: TeamMember;
    activeView: View;
    setActiveView: (view: View) => void;
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView, isCollapsed, setCollapsed }) => {
  return (
    <aside className={`bg-core-bg flex flex-col flex-shrink-0 border-r border-core-border transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-60'}`}>
      <div className={`flex items-center border-b border-core-border h-16 ${isCollapsed ? 'justify-center' : 'px-4'}`}>
          <div className="flex items-center gap-2">
              <SolvoLogoIcon className="w-7 h-7 text-core-accent flex-shrink-0"/>
              {!isCollapsed && <h1 className="text-xl font-bold text-core-text-primary leading-none">Solvo</h1>}
          </div>
      </div>
      
      <nav className="flex-1 px-3 space-y-4 py-4">
        <div>
          <h3 className={`px-2 text-xs font-semibold text-core-text-secondary/50 uppercase tracking-wider mb-2 ${isCollapsed ? 'hidden' : ''}`}>Menu</h3>
          <div className="space-y-1">
            <NavItem icon={<LayoutDashboardIcon size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} isCollapsed={isCollapsed} />
            <NavItem icon={<ClipboardCheckIcon size={20} />} label="My Week" active={activeView === 'my-week'} onClick={() => setActiveView('my-week')} isCollapsed={isCollapsed} />
            <NavItem icon={<ListIcon size={20} />} label="Tasks" active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} isCollapsed={isCollapsed} />
          </div>
        </div>
        <div>
          <h3 className={`px-2 text-xs font-semibold text-core-text-secondary/50 uppercase tracking-wider mb-2 ${isCollapsed ? 'hidden' : ''}`}>Management</h3>
          <div className="space-y-1">
            <NavItem icon={<UsersIcon size={20} />} label="Accounts" active={activeView === 'accounts'} onClick={() => setActiveView('accounts')} isCollapsed={isCollapsed} />
            <NavItem icon={<UserIcon size={20} />} label="Team" active={activeView === 'team'} onClick={() => setActiveView('team')} isCollapsed={isCollapsed} />
            <NavItem icon={<BookOpenIcon size={20} />} label="Knowledge Center" active={activeView === 'knowledge-center'} onClick={() => setActiveView('knowledge-center')} isCollapsed={isCollapsed} />
          </div>
        </div>
         <div>
          <h3 className={`px-2 text-xs font-semibold text-core-text-secondary/50 uppercase tracking-wider mb-2 ${isCollapsed ? 'hidden' : ''}`}>Performance</h3>
          <div className="space-y-1">
            <NavItem icon={<WorkflowIcon size={20} />} label="Performance Hub" active={activeView === 'performance'} onClick={() => setActiveView('performance')} isCollapsed={isCollapsed} />
            <NavItem icon={<AwardIcon size={20} />} label="Leaderboard" active={activeView === 'leaderboard'} onClick={() => setActiveView('leaderboard')} isCollapsed={isCollapsed} />
            <NavItem icon={<BarChartIcon size={20} />} label="Reports" active={activeView === 'reports'} onClick={() => setActiveView('reports')} isCollapsed={isCollapsed} />
          </div>
        </div>
        <div>
          <h3 className={`px-2 text-xs font-semibold text-core-text-secondary/50 uppercase tracking-wider mb-2 ${isCollapsed ? 'hidden' : ''}`}>System</h3>
          <div className="space-y-1">
            <NavItem icon={<DatabaseIcon size={20} />} label="Data Management" active={activeView === 'datamanagement'} onClick={() => setActiveView('datamanagement')} isCollapsed={isCollapsed} />
          </div>
        </div>
      </nav>

      <div className="px-3 py-4 mt-auto border-t border-core-border">
          <button 
                onClick={() => setCollapsed(!isCollapsed)} 
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className={`flex items-center w-full text-sm font-medium rounded-md transition-colors text-core-text-secondary hover:bg-core-bg-soft hover:text-core-text-primary ${isCollapsed ? 'justify-center h-11 w-11' : 'px-3 py-2.5'}`}
            >
             <ChevronsLeftIcon className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} size={20} />
             {!isCollapsed && <span className="ml-3">Collapse</span>}
           </button>
           <NavItem icon={<LogOutIcon size={20} />} label="Logout" onClick={() => {
              localStorage.removeItem('solvo-core-last-user');
              window.location.reload();
           }} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};