import { defineConfig } from 'tsup'
import pkg from './package.json'

// Replaces microbundle. microbundle relied on `next/babel` (via .babelrc) to strip
// TypeScript, because its own rollup-plugin-typescript2@0.32 does not transform
// anything under TypeScript 5.x. That worked by accident on Next 10 and broke on
// Next 16, and the shared .babelrc also forced Next off SWC/Turbopack.

// Anything the consumer installs stays external; only our own src is bundled.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]

export default defineConfig({
  entry: { index: 'src/index.tsx' },
  tsconfig: 'tsconfig.build.json',
  format: ['cjs', 'esm'],
  // `main` is dist/index.js and `module` is dist/index.es.js, so keep .js for cjs
  // and give esm the .es.js extension the package fields already point at.
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.js' : '.es.js' }),
  dts: true,
  sourcemap: true,
  clean: false, // prebuild:dist already ran rimraf, and style.css is built first
  minify: true,
  treeshake: true,
  external,
  // Matches the browserslist in package.json
  target: ['chrome64', 'edge79', 'firefox69', 'safari14.1'],
  env: { NODE_ENV: 'production' },
})
