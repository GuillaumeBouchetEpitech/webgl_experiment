
import * as esbuild from 'esbuild'

const isRelease = process.argv[2] !== 'debug';

const asyncRun = async () => {

  const minifyOptions = {
    minify: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
  };

  const allCalls = [
    async () => {

      console.log("building: main");

      let buildOptions = {
        entryPoints: ['./src/main/main.ts'],
        bundle: true,
        target: ['chrome58','firefox57','safari11','edge18'],
        tsconfig: './src/main/tsconfig.json',
        outfile: './dist/bundle.js',
      };

      if (isRelease) {
        buildOptions = { ...buildOptions, ...minifyOptions };
      }

      await esbuild.build(buildOptions);

      console.log(" -> built: main");
    },
    async () => {

      console.log("building: worker");

      let buildOptions = {
        entryPoints: ['./src/worker/main.ts'],
        bundle: true,
        target: ['chrome58','firefox57','safari11','edge18'],
        tsconfig: './src/worker/tsconfig.json',
        outfile: './dist/worker.js',
      };

      if (isRelease) {
        buildOptions = { ...buildOptions, ...minifyOptions };
      }

      await esbuild.build(buildOptions);

      console.log(" -> built: worker");
    },
  ];

  console.log(`start (release: ${isRelease})`)

  await Promise.all(allCalls.map(call => call()));

  console.log("stop");
};
asyncRun();

