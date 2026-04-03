/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0f3d2e",
        turf: "#2e8b57",
        sand: "#e8d8b7",
        ink: "#16212c",
        coral: "#ff6b4a",
        sky: "#8fd6e1"
      },
      boxShadow: {
        card: "0 18px 40px rgba(8, 31, 22, 0.12)"
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(143,214,225,0.35), transparent 30%), radial-gradient(circle at bottom right, rgba(255,107,74,0.18), transparent 25%)"
      }
    }
  },
  plugins: []
};
