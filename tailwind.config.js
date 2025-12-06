/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#3b2bee",
                "background-light": "#f6f6f8",
                "background-dark": "#121022",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "1rem", "lg": "2rem", "xl": "3rem", "full": "9999px" },
        },
    },
    plugins: [],
}
