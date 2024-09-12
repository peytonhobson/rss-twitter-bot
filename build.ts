const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'], // Change this to your entry file
  bundle: true, // Bundles all dependencies into a single file
  outdir: 'dist', // Output directory
  platform: 'node', // Target platform, can be 'browser' if you're building for the web
  target: ['esnext'], // Define ECMAScript version target
  sourcemap: true, // Generate source maps
  format: 'cjs', // Output format, 'cjs' for CommonJS or 'esm' for ES Modules
  external: ['some-external-package'], // Exclude specific packages from the bundle
}).catch(() => process.exit(1)); // Catch and handle build errors