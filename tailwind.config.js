/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ui)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        japanese: ['var(--font-japanese)', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', 'sans-serif'],
      },
      colors: {
        page: 'var(--bg-page)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          surface: 'var(--primary-surface)',
        },
        success: {
          DEFAULT: 'var(--success)',
          surface: 'var(--success-surface)',
        },
        error: {
          DEFAULT: 'var(--error)',
          surface: 'var(--error-surface)',
          border: 'var(--error-border)',
        },
        warning: 'var(--warning)',
        answer: {
          1: {
            bg: 'var(--answer-1-bg)',
            border: 'var(--answer-1-border)',
            text: 'var(--answer-1-text)',
          },
          2: {
            bg: 'var(--answer-2-bg)',
            border: 'var(--answer-2-border)',
            text: 'var(--answer-2-text)',
          },
          3: {
            bg: 'var(--answer-3-bg)',
            border: 'var(--answer-3-border)',
            text: 'var(--answer-3-text)',
          },
          4: {
            bg: 'var(--answer-4-bg)',
            border: 'var(--answer-4-border)',
            text: 'var(--answer-4-text)',
          },
        },
        category: {
          vocabulary: {
            surface: 'var(--category-vocabulary-surface)',
            border: 'var(--category-vocabulary-border)',
            icon: 'var(--category-vocabulary-icon)',
            text: 'var(--category-vocabulary-text)',
          },
          kanji: {
            surface: 'var(--category-kanji-surface)',
            border: 'var(--category-kanji-border)',
            icon: 'var(--category-kanji-icon)',
            text: 'var(--category-kanji-text)',
          },
        },
      },
      boxShadow: {
        'clay-card': 'var(--shadow-clay-card)',
        'clay-card-hover': 'var(--shadow-clay-card-hover)',
        'clay-button': 'var(--shadow-clay-button)',
        'clay-pressed': 'var(--shadow-clay-pressed)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      minHeight: {
        'touch': '48px',
        'answer': '56px',
      },
    },
  },
  plugins: [],
};
