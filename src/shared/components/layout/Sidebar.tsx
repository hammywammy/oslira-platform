// src/shared/components/layout/Sidebar.tsx

/**
 * SIDEBAR - SHARED LAYOUT COMPONENT
 * 
 * Linear-inspired minimalist sidebar for dashboard navigation.
 * 
 * FEATURES:
 * - Collapsible (240px → 64px)
 * - Business profile selector
 * - Credit balance display
 * - Account dropdown menu
 * - Active route highlighting
 * - Keyboard accessible
 * - Persists collapse state
 * 
 * ARCHITECTURE:
 * - State: Zustand + localStorage for collapse
 * - Data: React Query for business profiles
 * - Auth: useAuth hook integration
 * - Icons: Iconify (no emojis)
 * 
 * USAGE:
 * <Sidebar />
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '@/shared/stores/sidebarStore';
import { useAuth } from '@/features/auth/contexts/AuthProvider';
import { Tooltip } from '@/shared/components/ui/Tooltip';

// =============================================================================
// TYPES
// =============================================================================

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// =============================================================================
// NAVIGATION CONFIGURATION
// =============================================================================

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'mdi:view-dashboard-outline' },
      { label: 'Lead Research', path: '/leads', icon: 'mdi:account-search-outline' },
      { label: 'Analytics', path: '/analytics', icon: 'mdi:chart-line' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Campaigns', path: '/campaigns', icon: 'mdi:bullseye-arrow' },
      { label: 'Messages', path: '/messages', icon: 'mdi:message-text-outline' },
      { label: 'Integrations', path: '/integrations', icon: 'mdi:puzzle-outline' },
    ],
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function Sidebar() {
  const navigate = useNavigate();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const { user, account, logout } = useAuth();
  
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  // ==========================================================================
  // DERIVED STATE
  // ==========================================================================

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];
  const initial = displayName[0]?.toUpperCase() || 'U';
  const creditBalance = account?.credit_balance ?? 0;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-white border-r border-border
        transition-[width] duration-300 ease-out z-40
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      <div className="flex flex-col h-full">
        
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border flex-shrink-0">
          {/* Logo/Brand */}
          {!isCollapsed && (
            <span className="text-lg font-semibold text-text">Oslira</span>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted-light transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon
              icon={isCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'}
              width={20}
              className="text-text-secondary"
            />
          </button>
        </div>

        {/* ===== NAVIGATION ===== */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2 py-1 mb-1 rounded-lg hover:bg-muted-light transition-colors"
                >
                  <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                    {section.title}
                  </span>
                  <Icon
                    icon="mdi:chevron-down"
                    width={16}
                    className={`text-muted transition-transform ${
                      collapsedSections.has(section.title) ? '-rotate-90' : ''
                    }`}
                  />
                </button>
              )}

              {/* Section Divider (collapsed sidebar) */}
              {isCollapsed && (
                <div className="h-px bg-border my-3" />
              )}

              {/* Nav Items */}
              <div
                className={`space-y-1 ${
                  !isCollapsed && collapsedSections.has(section.title) ? 'hidden' : ''
                }`}
              >
                {section.items.map((item) => {
                  const navLink = (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-text hover:bg-muted-light hover:text-primary'
                        } ${isCollapsed ? 'justify-center' : ''}`
                      }
                    >
                      <Icon icon={item.icon} width={20} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </NavLink>
                  );

                  return isCollapsed ? (
                    <Tooltip key={item.path} content={item.label}>
                      {navLink}
                    </Tooltip>
                  ) : (
                    navLink
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ===== ACCOUNT SECTION ===== */}
        <div className="relative border-t border-border p-4 flex-shrink-0">
          {/* Account Dropdown */}
          <AnimatePresence>
            {showAccountMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAccountMenu(false)}
                />

                {/* Dropdown Menu */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`
                    absolute bg-white border border-border rounded-lg shadow-lg z-20
                    ${isCollapsed ? 'left-full ml-2 bottom-0' : 'bottom-full mb-2 left-0 right-0'}
                  `}
                  style={{ minWidth: isCollapsed ? '280px' : undefined }}
                >
                  {/* User Info */}
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-semibold text-text">{displayName}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
                  </div>

                  {/* Business Selector */}
                  <div className="p-3 border-b border-border">
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                      Business
                    </label>
                    <select className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors">
                      <option>Personal Account</option>
                    </select>
                  </div>

                  {/* Credits Display */}
                  <div className="p-3 border-b border-border">
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                      Credits
                    </label>
                    <div className="px-3 py-2 bg-surface-raised rounded-lg">
                      <span className="text-base font-semibold text-text">
                        {creditBalance} / 25
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2">
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted-light text-sm text-text transition-colors"
                    >
                      <Icon icon="mdi:cog-outline" width={18} />
                      <span>Settings</span>
                    </button>
                    <a
                      href="https://oslira.com/help"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted-light text-sm text-text transition-colors"
                    >
                      <Icon icon="mdi:help-circle-outline" width={18} />
                      <span>Get Help</span>
                    </a>
                    <a
                      href="https://oslira.com/upgrade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-light text-sm text-primary transition-colors font-medium"
                    >
                      <Icon icon="mdi:star-outline" width={18} />
                      <span>Upgrade Plan</span>
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-danger-light text-sm text-danger transition-colors mt-1 pt-3 border-t border-border"
                    >
                      <Icon icon="mdi:logout" width={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Account Trigger */}
          <Tooltip content={isCollapsed ? displayName : ''} position="right">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className={`
                w-full flex items-center gap-3 rounded-lg hover:bg-muted-light transition-colors
                ${isCollapsed ? 'justify-center p-2' : 'p-2'}
              `}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-white">{initial}</span>
              </div>

              {/* User Info (expanded only) */}
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{firstName}</p>
                    <p className="text-xs text-text-secondary">Free Plan</p>
                  </div>
                  <Icon
                    icon="mdi:chevron-down"
                    width={16}
                    className={`text-text-secondary transition-transform flex-shrink-0 ${
                      showAccountMenu ? 'rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
