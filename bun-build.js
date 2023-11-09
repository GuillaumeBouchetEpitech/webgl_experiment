
import { readFileSync } from "fs";

const GlslFilesLoaderPlugin = {
  name: "GLSL Loader",
  setup(build) {
    build.onLoad({ filter: /\.glsl\.(?:frag|vert)$/ }, ({ path }) => {

      const fileContent = readFileSync(path, { encoding: "utf8" });

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

const isRelease = process.argv[2] === 'release';

const asyncRun = async () => {

  const allEntries = ['main', 'worker'];

  const allConfigs = allEntries.map(entry => ({
    entrypoints: [`./src/${entry}/main.ts`],
    outdir: './dist',
    target: 'browser',
    format: "esm",
    root: `./src/${entry}`,
    naming: `[dir]/${entry}.[ext]`,
    plugins: [GlslFilesLoaderPlugin],
  }));

  if (isRelease === true) {
    allConfigs.forEach(config => {
      config.minify = {
        whitespace: true,
        identifiers: true,
        syntax: true,
      }
    });
  } else {
    allConfigs.forEach(config => {
      config.sourcemap = "inline";
    });
  }

  const results = await Promise.all(allConfigs.map(config => Bun.build(config)));

  for (const result of results) {
    if (result?.success === true) {
      console.log('SUCCESS');
    } else {
      console.log('ERROR.result', result);
    }
  }
};
asyncRun();
