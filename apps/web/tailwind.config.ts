import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: {
      brand: { DEFAULT: '#0a2342', light: '#1a4a7a', gold: '#c9a227' }
    }
  }},
  plugins: [],
} satisfies Config
