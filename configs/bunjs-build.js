
import * as fs from 'fs';

// console.log('process.argv', process.argv);

const _getBuildOptions = () => {
  const buildOptionsRegex = /build-options-(debug|release)/;

  // start at 2 (since 0 is "bun", and 1 is "bun-build.js")
  for (let ii = 2; ii < process.argv.length; ++ii) {
    const capture = buildOptionsRegex.exec(process.argv[ii]);
    if (!capture) {
      continue;
    }

    return { buildType: capture[0] };
  }

  throw new Error('missing build options argument, stopping now');
};

const buildOptions = _getBuildOptions();

//
//
//

const GlslFilesLoaderPlugin = {
  name: "GLSL Loader",
  setup(build) {
    build.onLoad({ filter: /\.glsl\.(?:frag|vert)$/ }, ({ path }) => {

      const fileContent = fs.readFileSync(path, { encoding: "utf8" });

      const lines = fileContent
        .split("\n")
        // .map(line => line.trim())
        // .filter(line => line.replace(/(.*?)\/\/.*/, "$1"))
        // .filter(line => line.length > 0)
        ;

      const contents = `export default \`${lines.join('\n')}\`.trim();`;

      return { contents, loader: "js" };
    });
  },
};

const asyncBuild = async (folderName, outputFile) => {

  console.log(` -> BUILDING ${folderName}`);
  const startTime = Date.now();

  const config = {
    entrypoints: [`./src/${folderName}/main.ts`],
    outdir: './dist',
    target: 'browser',
    format: "esm",
    root: `./src/${folderName}`,
    naming: `[dir]/${outputFile}`,
    plugins: [GlslFilesLoaderPlugin],
  };

  if (buildOptions.buildType === 'release') {
    config.minify = {
      whitespace: true,
      identifiers: true,
      syntax: true,
    }
  } else {
    config.sourcemap = "inline";
  }

  const result = await Bun.build(config);

  if (!result || result.success === false) {
    console.log('ERROR.result', result);
    return;
  }

  const endTime = Date.now();
  const elapsedTime = ((endTime - startTime) / 1000).toFixed(3);

  console.log(`    -> BUILT ${folderName} (${elapsedTime}sec)`);
  const statData = fs.statSync(`./dist/${outputFile}`);
  console.log(`      -> SIZE ${Math.ceil(statData.size / 1024)}ko`);
};

const asyncRun = async () => {
  await Promise.all([
    asyncBuild('main', 'bundle.js'),
    asyncBuild('worker', 'worker.js'),
  ]);
};
asyncRun();
