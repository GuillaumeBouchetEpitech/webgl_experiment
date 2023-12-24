import { rollup } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import * as fs from 'fs';

// console.log('process.argv', process.argv);

const _getBuildOptions = () => {
  const buildOptionsRegex = /build-options-(debug|release)/;

  // start at 2 (since 0 is "node", and 1 is "rollup")
  for (let ii = 2; ii < process.argv.length; ++ii) {
    const capture = buildOptionsRegex.exec(process.argv[ii]);
    if (!capture) {
      continue;
    }

    return { isRelease: capture[1] === 'release' };
  }

  throw new Error('missing build options argument, stopping now');
};

const buildOptions = _getBuildOptions();

//
//
//

const _isShader = (filename) => (
  filename.indexOf("glsl.vert") >= 0 ||
  filename.indexOf("glsl.frag") >= 0
);

const _handleGlslFilesPlugin = {
  name: "bundle-glsl-files",
  transform(code, id) {
    if (!_isShader(id)) {
      return;
    }
    return {
      code: `export default \`${code}\`.trim();`,
      map: { mappings: "" }
    };
  }
};

//
//
//

const asyncBuild = async ({
  name,
  tsConfigFilePath,
  inputFilePath,
  outputFilePath,
}) => {

  console.log(` -> BUILDING ${name}`);
  const startTime = Date.now();

  const plugins = [
    typescript({ tsconfig: tsConfigFilePath }),
    commonjs(),
    nodeResolve(),
    _handleGlslFilesPlugin
  ];

  if (buildOptions.isRelease) {
    plugins.push(terser({
      format: { comments: false },
      compress: { passes: 3 },
    }));
  }

  const inputOptions = {
    input: inputFilePath,
    plugins,
  };
  const outputOptions = {
    file: outputFilePath,
    format: 'cjs',
  };

  let bundle;
  let buildFailed = false;
  try {
    bundle = await rollup(inputOptions);
    await bundle.write(outputOptions);
  } catch (error) {
    buildFailed = true;
    console.log('ERROR.result', error);
  } finally {
    if (bundle) {
      await bundle.close();
    }
  }

  if (buildFailed) {
    return;
  }

  const endTime = Date.now();
  const elapsedTime = ((endTime - startTime) / 1000).toFixed(3);

  console.log(`    -> BUILT ${name} (${elapsedTime}sec)`);
  const statData = fs.statSync(outputFilePath);
  console.log(`      -> SIZE ${Math.ceil(statData.size / 1024)}ko`);
}

const asyncRun = async () => {
  await Promise.all([
    asyncBuild({
      name: 'main',
      tsConfigFilePath: `./src/main/tsconfig.json`,
      inputFilePath: `./src/main/main.ts`,
      outputFilePath: `./dist/bundle.js`,
    }),
    asyncBuild({
      name: 'worker',
      tsConfigFilePath: `./src/worker/tsconfig.json`,
      inputFilePath: `./src/worker/main.ts`,
      outputFilePath: `./dist/worker.js`,
    }),
  ]);
};
asyncRun();



