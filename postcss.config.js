const path = require('path')
const importFrom = path.resolve(__dirname, './defaults.json')

// Config for the Next.js docs site only.
//
// The published stylesheet is built by `npm run build:postcss` using the separate
// config in config/postcss. That one additionally runs postcss-preset-env, which
// would mangle Tailwind v4's modern output (oklch, @property) if it ran here too.
module.exports = {
  plugins: {
    // Use the new Tailwind PostCSS wrapper
    '@tailwindcss/postcss': {},
    // Required, not optional: src/style.css references --rsbs-bg, --rsbs-handle-bg
    // and friends without defining them — the default values live in defaults.json
    // and are injected here as `var(--rsbs-bg, #fff)` fallbacks. Without this the
    // sheet renders with a transparent background and an invisible drag handle.
    'postcss-custom-properties-fallback': { importFrom },
    'postcss-import-svg': {
      paths: [path.resolve(__dirname, 'docs')],
      svgo: {
        plugins: [
          {
            removeUnknownsAndDefaults: {
              // On by default, disabled as it breaks the frame.svg
              unknownAttrs: false,
            },
          },
        ],
      },
    },

    autoprefixer: {},
  },
}
