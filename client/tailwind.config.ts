// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        void: { 950: '#0A0A0F', 900: '#111118', 800: '#1A1A24',
                700: '#24242F', 600: '#3A3A48' },
        ghost: { 500: '#6B6B7B', 400: '#8E8E9E', 300: '#B0B0BE',
                 200: '#D0D0D8', 100: '#E8E8EC', 50: '#F5F5F7' },
        cipher: { blue: '#3B82F6', glow: '#60A5FA', dim: '#1E40AF' },
        signal: { violet: '#8B5CF6' },
        burn: { amber: '#F59E0B', glow: '#FBBF24' },
      },
      backgroundImage: {
        'ambient-dark': 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.05) 0%, transparent 60%)',
        'ambient-card': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        'glass-border': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
      },
    },
  },
};

export default config;
