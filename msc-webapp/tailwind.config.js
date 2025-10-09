/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from copilot-instructions.md
        primary: {
          DEFAULT: '#0078d4',
          hover: '#50e6ff',
        },
        navy: '#203a6c',
        background: {
          white: '#ffffff',
          light: '#f2f2f2',
        },
        text: {
          DEFAULT: '#2e2e2e',
          light: '#ffffff',
        },
        accent: '#50e6ff',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
