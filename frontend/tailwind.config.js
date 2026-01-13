/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // WhatsApp-like colors or custom palette
                primary: '#128C7E',
                secondary: '#25D366',
                dark: '#1F2C34',
                darker: '#121B22',
            }
        },
    },
    plugins: [],
}
