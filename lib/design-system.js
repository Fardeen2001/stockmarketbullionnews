/**
 * Comprehensive Design System
 * Professional design tokens and utilities for consistent UI
 */

export const designSystem = {
  // Color Palette (60-30-10: primary 60%, secondary 30%, accent 10%)
  colors: {
    primary: {
      DEFAULT: '#F0F0F0',
      50: '#fafafa',
      100: '#F0F0F0',
      200: '#e8e8e8',
      300: '#d8d8d8',
    },
    secondary: {
      DEFAULT: '#96AAAA',
      100: '#c8d4d4',
      200: '#96AAAA',
      300: '#7a9a9a',
    },
    accent: {
      DEFAULT: '#192D3C',
      100: '#2d4a5c',
      200: '#192D3C',
      300: '#142535',
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
    },
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #192D3C 0%, #2a4555 100%)',
    secondary: 'linear-gradient(135deg, #96AAAA 0%, #7a9a9a 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    info: 'linear-gradient(135deg, #96AAAA 0%, #7a9a9a 100%)',
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

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    colored: {
      primary: '0 10px 15px -3px rgb(25 45 60 / 0.3), 0 4px 6px -4px rgb(25 45 60 / 0.3)',
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
  const base = 'rounded-3xl border border-secondary-300 shadow-lg hover:shadow-xl transition-all duration-300 bg-secondary/80';
  
  const variants = {
    default: base,
    interactive: `${base} hover-lift cursor-pointer`,
    elevated: `${base} shadow-xl hover:shadow-2xl`,
  };
  
  return variants[variant] || base;
};

export const getHeadingClasses = (level = 1) => {
  const headings = {
    1: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight',
    2: 'text-3xl sm:text-4xl md:text-5xl font-bold leading-tight',
    3: 'text-2xl sm:text-3xl md:text-4xl font-bold',
    4: 'text-xl sm:text-2xl md:text-3xl font-semibold',
  };
  
  return headings[level] || headings[1];
};

export const getGradientTextClasses = () => {
  return 'gradient-text text-accent';
};

export const getButtonClasses = (variant = 'primary', size = 'md') => {
  const base = 'font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: `${base} bg-accent text-white shadow-lg hover:shadow-xl hover-lift`,
    secondary: `${base} bg-secondary text-white hover:bg-accent border border-secondary-300`,
    outline: `${base} border-2 border-accent text-accent hover:bg-accent hover:text-white`,
    ghost: `${base} text-accent hover:bg-secondary/30`,
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return `${variants[variant]} ${sizes[size]}`;
};

export default designSystem;
