/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: 'Ubuntu, sans-serif'
      },
      colors: {
        primary: {
          /**
           * Background neutral
           */
          100: '#F6F3F8',
          /**
           * Background element point of interest
           */
          200: '#E8DFEE',
          /**
           * Background element point of interest darker
           */
          300: '#AA90BF',
          /**
           * Hover
           */
          400: '#6D418F',
          /**
           * Main elements or text
           */
          500: '#491273',
          /**
           * Darker text
           */
          700: '#3A0E5B',
          800: '#2A0A42'
        },
        secondary: '#D40983',
        default: '#1A1A1A',
        grey: {
          100: '#F8F8F7',
          200: '#E3E3DB'
        }
      },
      typography: {
        DEFAULT: {
          css: {
            blockquote: {
              'font-style': 'normal',
              'border-left': 'none',
              'padding-left': '0',
              'border-radius': '1rem',
              padding: '0.5rem',
              'background-color': 'grey',
              p: {
                margin: '0.5rem'
              },
              'p:first-of-type::before': {
                content: 'none'
              },
              'p:first-of-type::after': {
                content: 'none'
              }
            }
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
