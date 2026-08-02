const path = require('path')
const importFrom = path.resolve(__dirname, '../../defaults.json')

// Config for the published stylesheet (`npm run build:postcss` -> dist/style.css).
//
// Kept separate from the docs site config because src/style.css relies on
// postcss-preset-env to compile `:matches()` and nested rules, and because the
// custom-property fallbacks must be generated from defaults.json so downstream
// consumers copying style.css get the same values.
module.exports = {
  plugins: {
    'postcss-custom-properties-fallback': { importFrom },
    // @TODO add importFrom to preset-env when CSS snapshot testing is in place
    'postcss-preset-env': { importFrom, stage: 0 },
    autoprefixer: {},
  },
}
