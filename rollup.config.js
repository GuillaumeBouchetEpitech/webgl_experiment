
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isDebug = process.env["BUILD_MODE"] === 'DEBUG';
const isWorker = process.env["BUILD_TARGET"] === 'WORKER';

const folderName = isWorker === false ? 'main' : 'worker';
const outputFile = isWorker === false ? 'bundle.js' : 'worker.js';

const plugins = [
  typescript({ tsconfig: `./src/${folderName}/tsconfig.json` }),
  commonjs(),
  nodeResolve(),
];

if (isDebug === false) {
  plugins.push(terser({
    format: { comments: false },
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
      // properties: {
      //   // regex: /indexPosition|realPosition|float32buffer/,
      //   reserved: [
      //     'indexPosition','realPosition','float32buffer',
      //     'Z', 'Q', 'A', 'S', 'W', 'D',
      //     'ArrowLeft','ArrowRight', 'ArrowUp', 'ArrowDown',
      //   ],
      //   // keep_quoted: true,
      //   // builtins: true,
      // },
    },
    keep_classnames: false,
    keep_fnames: false,
    compress: {
      passes: 3,
    },
  }));
}

export default {
  input: `./src/${folderName}/main.ts`,
  output: {
    file: `./dist/${outputFile}`,
    format: 'cjs',
  },
  plugins,
};
