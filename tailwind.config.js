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
          '0%, 100%': { boxShadow: '0 0 20px rgba(74, 144, 181, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(74, 144, 181, 0.5)' },
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
        'gradient-primary': 'linear-gradient(135deg, #4A90B5 0%, #5BA3C9 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #B0D0E8 0%, #9BC4E0 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-info': 'linear-gradient(135deg, #B0D0E8 0%, #9BC4E0 100%)',
      },
      colors: {
        // Keep in sync with app/globals.css :root (canonical palette)
        primary: {
          DEFAULT: '#F2F7FC',
          50: '#F8FBFD',
          100: '#F2F7FC',
          200: '#E8F2F9',
          300: '#D4E8F4',
          400: '#B8D9ED',
          500: '#9BC4E0',
        },
        secondary: {
          DEFAULT: '#B0D0E8',
          50: '#E0EDF7',
          100: '#C8E0F0',
          200: '#B0D0E8',
          300: '#9BC4E0',
          400: '#7AB0D4',
          500: '#5B9EC6',
        },
        accent: {
          DEFAULT: '#4A90B5',
          50: '#6BA3C4',
          100: '#5B9EC6',
          200: '#4A90B5',
          300: '#3D7A9E',
          400: '#2E6B8A',
          500: '#245A75',
        },
      },
    },
  },
  plugins: [],
}

