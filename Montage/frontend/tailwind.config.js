/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Unbounded', 'system-ui', 'sans-serif'],
                body: ['Outfit', 'system-ui', 'sans-serif'],
                funky: ['Boogaloo', 'cursive'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            colors: {
                neon: {
                    cyan: '#00F0FF',
                    pink: '#FF2DD4',
                    lime: '#B8FF2D',
                    yellow: '#FFE83D',
                    orange: '#FF8A2D',
                    red: '#FF2F4F',
                    blue: '#2F7BFF',
                    purple: '#8B5CFF',
                },
                void: {
                    DEFAULT: '#050505',
                    soft: '#0A0A12',
                    panel: '#0F1020',
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'float-up': {
                    '0%': { transform: 'translateY(100vh) scale(0.6)', opacity: '0' },
                    '15%': { opacity: '1' },
                    '100%': { transform: 'translateY(-12vh) scale(1.4)', opacity: '0' }
                },
                'disco-swing': {
                    '0%,100%': { transform: 'rotate(-8deg) translateY(0)' },
                    '50%': { transform: 'rotate(8deg) translateY(6px)' }
                },
                'neon-shift': {
                    '0%': { backgroundPosition: '0% center' },
                    '100%': { backgroundPosition: '200% center' }
                },
                'slow-zoom': {
                    '0%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1.15)' }
                },
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(28px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'pulse-ring': {
                    '0%': { transform: 'scale(0.9)', opacity: '0.7' },
                    '100%': { transform: 'scale(1.6)', opacity: '0' }
                },
                'marquee': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' }
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'float-up': 'float-up 5.6s linear forwards',
                'disco-swing': 'disco-swing 5s ease-in-out infinite',
                'neon-shift': 'neon-shift 4s linear infinite',
                'slow-zoom': 'slow-zoom 8s ease-out forwards',
                'fade-up': 'fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
                'marquee': 'marquee 60s linear infinite',
                'shimmer': 'shimmer 3s linear infinite',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
