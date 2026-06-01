/** Tailwind config for the Launch Command Center (compiled to app.css). */
module.exports = {
  content: ['./index.html', './app.jsx', './app.js'],
  theme: {
    extend: {
      colors: {
        navy:   '#0A1628',
        navy2:  '#11233f',
        navy3:  '#1b3357',
        orange: '#FF6B2B',
        orange2:'#ff8753',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
