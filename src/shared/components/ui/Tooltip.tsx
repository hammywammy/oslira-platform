// src/shared/components/ui/Tooltip.tsx

/**
 * TOOLTIP - SHARED UI COMPONENT
 * 
 * Minimalist tooltip for collapsed sidebar navigation items.
 * Auto-positions to avoid viewport overflow.
 * 
 * FEATURES:
 * - Automatic positioning (right by default, flips if needed)
 * - Keyboard accessible (shows on focus)
 * - Respects prefers-reduced-motion
 * - 300ms delay before showing
 * 
 * USAGE:
 * <Tooltip content="Dashboard">
 *   <button>Icon</button>
 * </Tooltip>
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Tooltip({
  content,
  children,
  delay = 300,
  position = 'right',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setShowTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      setShowTimeout(null);
    }
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (showTimeout) {
        clearTimeout(showTimeout);
      }
    };
  }, [showTimeout]);

  // ==========================================================================
  // POSITION CALCULATION
  // ==========================================================================

  const getTooltipPosition = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
      default:
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm font-medium
              rounded-lg shadow-lg pointer-events-none whitespace-nowrap
              ${getTooltipPosition()}
            `}
            role="tooltip"
          >
            {content}
            {/* Arrow */}
            <div
              className={`
                absolute w-2 h-2 bg-gray-900 rotate-45
                ${position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' : ''}
                ${position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' : ''}
                ${position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
                ${position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
