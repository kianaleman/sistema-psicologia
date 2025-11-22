/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        clinica: {
          "primary": "#0F172A",    // Azul noche muy oscuro (Casi negro) -> Elegancia
          "secondary": "#64748B",  // Gris pizarra -> Para textos secundarios
          "accent": "#0EA5E9",     // Azul cielo vibrante -> Para detalles pequeños
          "neutral": "#3D4451",
          "base-100": "#FFFFFF",   // Fondo blanco puro
          "info": "#3ABFF8",
          "success": "#10B981",    // Verde esmeralda
          "warning": "#F59E0B",
          "error": "#EF4444",
        },
      },
      "light", // Fallback
    ],
  },
}