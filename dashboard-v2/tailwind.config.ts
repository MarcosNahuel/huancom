import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#f9d7ac',
          300: '#f5ba77',
          400: '#f09440',
          500: '#ec7619',
          600: '#dd5c10',
          700: '#b74410',
          800: '#923715',
          900: '#762f14',
        },
      },
    },
  },
  plugins: [],
}

export default config
