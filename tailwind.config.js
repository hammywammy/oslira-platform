module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./src/**/*.css"  // Scan component CSS files for @apply usage
  ],
  theme: {
    extend: {
      // =============================================================================
      // DESIGN SYSTEM COLORS
      // =============================================================================
      colors: {
        // Primary Brand Colors
        'oslira-blue': '#2D6CDF',
        'oslira-purple': '#8A6DF1',
        'accent-teal': '#06B6D4',
        
        // Semantic Status Colors
        'success': '#10B981',
        'success-light': '#34D399',
        'warning': '#F59E0B',
        'warning-light': '#FBBF24',
        'error': '#EF4444',
        'error-light': '#F87171',
        'info': '#3B82F6',
        'info-light': '#60A5FA',
        
        // Extended Gray Palette
        'gray': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A'
        }
      },
      
      // =============================================================================
      // TYPOGRAPHY SYSTEM
      // =============================================================================
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace']
      },
      
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
        '4xl': ['42px', { lineHeight: '48px' }],
        '5xl': ['56px', { lineHeight: '64px' }],
        '6xl': ['74px', { lineHeight: '80px' }]
      },
      
      // =============================================================================
      // SPACING SYSTEM
      // =============================================================================
      spacing: {
        '0.5': '2px',
        '1.5': '6px',
        '2.5': '10px',
        '3.5': '14px',
        '18': '72px',
        '88': '352px',
        '128': '512px'
      },
      
      // =============================================================================
      // COMPONENT DIMENSIONS
      // =============================================================================
      width: {
        'sidebar': '280px',
        'sidebar-collapsed': '64px'
      },
      
      height: {
        'nav': '64px',
        'button-sm': '32px',
        'button-md': '40px',
        'button-lg': '48px',
        'button-xl': '56px'
      },
      
      // =============================================================================
      // BORDER RADIUS SYSTEM
      // =============================================================================
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px'
      },
      
      // =============================================================================
      // SHADOW SYSTEM
      // =============================================================================
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px rgba(45, 108, 223, 0.1)',
        'md': '0 4px 6px rgba(45, 108, 223, 0.1)',
        'lg': '0 8px 15px rgba(45, 108, 223, 0.15)',
        'xl': '0 12px 25px rgba(45, 108, 223, 0.2)',
        '2xl': '0 20px 50px rgba(45, 108, 223, 0.15)',
        'hover': '0 8px 25px rgba(45, 108, 223, 0.25)',
        'focus': '0 0 0 3px rgba(45, 108, 223, 0.1)',
        'pressed': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        'modern': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        'modern-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      },
      
      // =============================================================================
      // ANIMATION SYSTEM
      // =============================================================================
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out 150ms both',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite'
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }
        },
        'pulse-glow': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)'
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)'
          }
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(1.5rem)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(2rem)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      
      // =============================================================================
      // TRANSITION TIMING
      // =============================================================================
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '250': '250ms',
        '400': '400ms',
        '600': '600ms'
      },
      
      // =============================================================================
      // Z-INDEX MANAGEMENT
      // =============================================================================
      zIndex: {
        'hide': '-1',
        'auto': 'auto',
        'base': '0',
        'docked': '10',
        'dropdown': '1000',
        'sticky': '1100',
        'banner': '1200',
        'overlay': '1300',
        'modal': '1400',
        'popover': '1500',
        'skipnav': '1600',
        'toast': '1700',
        'tooltip': '1800'
      },
      
      // =============================================================================
      // BACKDROP FILTERS
      // =============================================================================
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px'
      },
      
      // =============================================================================
      // GRADIENT STOPS
      // =============================================================================
      gradientColorStops: {
        'brand-start': '#2D6CDF',
        'brand-end': '#8A6DF1',
        'accent': '#06B6D4'
      }
    }
  },
  plugins: [
    // Add form plugin for better form styling
    require('@tailwindcss/forms')({
      strategy: 'class'
    })
  ]
}
