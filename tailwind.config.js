/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in': 'slideIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient': 'gradient-shift 3s ease infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(25, 45, 60, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(25, 45, 60, 0.6)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #192D3C 0%, #2a4555 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #96AAAA 0%, #7a9a9a 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-info': 'linear-gradient(135deg, #96AAAA 0%, #7a9a9a 100%)',
      },
      colors: {
        primary: {
          DEFAULT: '#F0F0F0',
          50: '#fafafa',
          100: '#F0F0F0',
          200: '#e8e8e8',
          300: '#d8d8d8',
          400: '#c0c0c0',
          500: '#a0a0a0',
        },
        secondary: {
          DEFAULT: '#96AAAA',
          50: '#e8ecec',
          100: '#c8d4d4',
          200: '#96AAAA',
          300: '#7a9a9a',
          400: '#5e8a8a',
          500: '#4a7272',
        },
        accent: {
          DEFAULT: '#192D3C',
          50: '#2d4a5c',
          100: '#3d5a6c',
          200: '#192D3C',
          300: '#142535',
          400: '#0f1d2a',
          500: '#0a151f',
        },
      },
    },
  },
  plugins: [],
}

