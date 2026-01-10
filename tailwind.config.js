/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyberbg: "#0a0a0f",
        cybercard: "#12121a",
        cyberborder: "#1f1f2e",
        neonblue: "#00f6ff",
        neonpurple: "#8b5cf6",
        neonpink: "#ff00ff",
      },
      boxShadow: {
        neon: "0 0 20px rgba(0,246,255,0.5)",
        neonStrong: "0 0 35px rgba(139,92,246,0.7)",
      },
    },
  },
  plugins: [],
};
