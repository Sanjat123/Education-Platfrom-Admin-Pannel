/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyberbg: "#050509", // Deep dark background
        cybercard: "rgba(18, 18, 26, 0.7)", // Glass effect
        neonblue: "#00f6ff", // Bright neon
        neonpurple: "#a855f7", // Vibrant purple
        neonpink: "#ec4899", // Pop of pink
      },
      boxShadow: {
        'neon': "0 0 20px rgba(0,246,255,0.5)", // Blue glow
        'neonStrong': "0 0 35px rgba(168, 85, 247, 0.7)", // Purple glow
      }
    }
  },
  plugins: [],
};