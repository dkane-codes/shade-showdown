/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom vibrant color palette
        primary: {
          50: '#FFF5F5',
          100: '#FFE3E3',
          200: '#FFC9C9',
          300: '#FFA8A8',
          400: '#FF8787',
          500: '#FF6B6B', // Main primary
          600: '#FA5252',
          700: '#E03131',
          800: '#C92A2A',
          900: '#862E2E',
        },
        secondary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#4ECDC4', // Main secondary
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        accent: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#45B7D1', // Main accent
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        warm: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FFE66D', // Main warm
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        cool: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#A8E6CF', // Main cool
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        vibrant: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF8E53', // Main vibrant
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        deep: {
          50: '#F3F4F6',
          100: '#E5E7EB',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#6B7280',
          500: '#6C5CE7', // Main deep
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        soft: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FDCB6E', // Main soft
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #45B7D1 0%, #6C5CE7 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FFE66D 0%, #FF8E53 100%)',
        'gradient-cool': 'linear-gradient(135deg, #A8E6CF 0%, #45B7D1 100%)',
        'gradient-mixed': 'linear-gradient(135deg, #FF6B6B 0%, #45B7D1 50%, #6C5CE7 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'vibrant': '0 10px 25px -3px rgba(255, 107, 107, 0.3), 0 4px 6px -2px rgba(255, 107, 107, 0.1)',
        'cool': '0 10px 25px -3px rgba(69, 183, 209, 0.3), 0 4px 6px -2px rgba(69, 183, 209, 0.1)',
        'warm': '0 10px 25px -3px rgba(255, 230, 109, 0.3), 0 4px 6px -2px rgba(255, 230, 109, 0.1)',
      },
    },
  },
  plugins: [],
}
