
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isDebug = process.env["BUILD_MODE"] === 'DEBUG';
const isWorker = process.env["BUILD_TARGET"] === 'WORKER';

const plugins = [
  typescript(),
  commonjs(),
  nodeResolve(),
];

if (isDebug === false) {
  plugins.push(terser({ format: { comments: false }, compress: true }));
}

const inputFile = isWorker === false ? 'main/main.ts' : 'worker/main.ts';
const outputFile = isWorker === false ? 'bundle.js' : 'worker.js';

export default {
  input: `./src/${inputFile}`,
  output: {
    file: `./dist/${outputFile}`,
    format: 'cjs',
  },
  plugins,
};
