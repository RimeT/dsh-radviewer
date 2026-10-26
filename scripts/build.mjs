import * as esbuild from 'esbuild';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const worker = spawnSync(process.execPath, ['scripts/build-worker.mjs'], { stdio: 'inherit' });
if (worker.status !== 0) process.exit(worker.status ?? 1);

const workerSource = readFileSync('dist/volume.worker.js', 'utf8');

const raw = {
  name: 'raw',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: args.path.replace(/\?raw$/, ''),
      namespace: 'raw-text',
      pluginData: args.resolveDir,
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-text' }, (args) => ({
      contents: `export default ${JSON.stringify(readFileSync(path.join(args.pluginData, args.path), 'utf8'))};`,
      loader: 'js',
    }));
  },
};

await esbuild.build({
  entryPoints: ['src/entry.ts'],
  outfile: 'client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  minify: true,
  legalComments: 'none',
  external: ['react', 'react/jsx-runtime'],
  define: { __MEDVIEW_WORKER_SOURCE__: JSON.stringify(workerSource) },
  plugins: [raw],
  banner: {
    js: "window.__ModuleLoader__.load({id:'@local/dsh-medview',factory(require){var module={exports:{}};var exports=module.exports;",
  },
  footer: { js: 'return module.exports;}});' },
});
