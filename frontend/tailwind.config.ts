import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Uber-inspired color palette
        uber: {
          black: '#000000',
          dark: '#1a1a1a',
          gray: '#6b6b6b',
          lightgray: '#f6f6f6',
          white: '#ffffff',
          green: '#276ef1',     // Primary action blue
          accent: '#05944f',    // Success green
          error: '#e11900',     // Error red
        },
      },
      fontFamily: {
        sans: ['UberMove', 'UberMoveText', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'floating': '0 8px 32px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        'uber': '8px',
      },
    },
  },
  plugins: [],
};

export default config;
