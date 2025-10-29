// src/shared/stores/sidebarStore.ts

/**
 * SIDEBAR STORE - ZUSTAND STATE MANAGEMENT
 * 
 * Manages sidebar UI state:
 * - Collapse/expand state
 * - localStorage persistence
 * - Cross-component synchronization
 * 
 * ARCHITECTURE:
 * - Single source of truth for sidebar state
 * - Automatic persistence to localStorage
 * - Simple, type-safe API
 * 
 * USAGE:
 * const { isCollapsed, toggleCollapse, collapse, expand } = useSidebarStore();
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  collapse: () => void;
  expand: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // State
      isCollapsed: false,

      // Actions
      toggleCollapse: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
        })),

      collapse: () =>
        set({
          isCollapsed: true,
        }),

      expand: () =>
        set({
          isCollapsed: false,
        }),
    }),
    {
      name: 'oslira-sidebar', // localStorage key
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
      }),
    }
  )
);
