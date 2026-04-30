/**
 * Comprehensive Design System - Dark Theme
 * Professional design tokens and utilities for consistent UI
 * Slate charcoal backgrounds with emerald accents
 */

export const designSystem = {
  // Color Palette - Dark Theme (Slate + Emerald)
  colors: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      elevated: '#475569',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      tertiary: '#64748b',
    },
    accent: {
      DEFAULT: '#10b981',
      hover: '#059669',
      light: '#34d399',
      dark: '#047857',
    },
    border: {
      DEFAULT: '#334155',
      hover: '#475569',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },

  // Gradients - Dark theme with emerald
  gradients: {
    primary: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    secondary: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    card: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.75rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // Spacing Scale
  spacing: {
    container: {
      padding: {
        mobile: '1rem',
        tablet: '1.5rem',
        desktop: '2rem',
      },
      maxWidth: '1280px',
    },
    section: {
      mobile: '3rem',
      tablet: '4rem',
      desktop: '5rem',
    },
    component: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
  },

  // Border Radius
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
    full: '9999px',
  },

  // Shadows - Dark theme with emerald glow
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.7)',
    emerald: '0 0 20px rgba(16, 185, 129, 0.3)',
    emeraldLg: '0 0 40px rgba(16, 185, 129, 0.4)',
    colored: {
      emerald: '0 10px 15px -3px rgb(16 185 129 / 0.3), 0 4px 6px -4px rgb(16 185 129 / 0.3)',
      success: '0 10px 15px -3px rgb(16 185 129 / 0.3), 0 4px 6px -4px rgb(16 185 129 / 0.3)',
      warning: '0 10px 15px -3px rgb(245 158 11 / 0.3), 0 4px 6px -4px rgb(245 158 11 / 0.3)',
    },
  },

  // Transitions
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Breakpoints (matching Tailwind)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Utility functions
export const getContainerClasses = () => {
  return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
};

export const getSectionPadding = () => {
  return 'py-8 md:py-12 lg:py-16';
};

export const getPageHeaderClasses = () => {
  return 'mb-10 md:mb-12 lg:mb-16 animate-fade-in';
};

export const getCardClasses = (variant = 'default') => {
  const base = 'rounded-2xl border border-slate-700/50 shadow-card hover:shadow-emerald transition-all duration-300 bg-gradient-to-br from-slate-800 to-slate-900';

  const variants = {
    default: base,
    interactive: `${base} hover-lift cursor-pointer`,
    elevated: `${base} shadow-card-lg hover:shadow-emerald`,
  };

  return variants[variant] || base;
};

export const getHeadingClasses = (level = 1) => {
  const headings = {
    1: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-slate-50',
    2: 'text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-50',
    3: 'text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50',
    4: 'text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50',
  };

  return headings[level] || headings[1];
};

export const getGradientTextClasses = () => {
  return 'gradient-text';
};

export const getButtonClasses = (variant = 'primary', size = 'md') => {
  const base = 'font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-2 focus:ring-offset-slate-900';

  const variants = {
    primary: `${base} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-emerald hover:shadow-lg hover:-translate-y-0.5`,
    secondary: `${base} bg-slate-700 text-slate-50 hover:bg-slate-600 border border-slate-600`,
    outline: `${base} border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white`,
    ghost: `${base} text-emerald-400 hover:bg-slate-800`,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return `${variants[variant]} ${sizes[size]}`;
};

export default designSystem;
