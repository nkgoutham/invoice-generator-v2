/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Poppins',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Primary accent color - muted blue
        accent: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#c7e1ff',
          300: '#a0cbff',
          400: '#73adff',
          500: '#5090f0', // Main accent
          600: '#3a72d4',
          700: '#2a5cb3',
          800: '#294d94',
          900: '#284379',
        },
        // Secondary accent - subtle teal
        'accent-secondary': {
          50: '#f0fdfd',
          100: '#ccf7f8',
          200: '#a1f0f7',
          300: '#70e2eb',
          400: '#43c9d9',
          500: '#77B5FE', // Main secondary
          600: '#2798ad',
          700: '#1f7a92',
          800: '#1e637a',
          900: '#1e5468',
        },
        // Neutrals
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        }
      },
      boxShadow: {
        'subtle': '0 2px 10px 0 rgba(0,0,0,0.05)',
        'card': '0 4px 15px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.05)',
        'hover': '0 10px 25px rgba(0,0,0,0.05), 0 3px 5px rgba(0,0,0,0.04)',
        'button': '0 1px 2px rgba(0,0,0,0.05)',
        'modal': '0 10px 40px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale': 'scale 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scale: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionTimingFunction: {
        'bounce-subtle': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '400': '400ms',
      },
      screens: {
        'xs': '420px', // Add extra small breakpoint
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}