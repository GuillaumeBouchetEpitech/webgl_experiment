
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

  await Promise.all(allConfigs.map(config => Bun.build(config)));

};
asyncRun();
