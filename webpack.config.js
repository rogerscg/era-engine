const WorkerPlugin = require('worker-plugin');
const path = require('path');

const EXAMPLES = [
  'basic',
  'character',
  'lod',
  'maze',
  'physics',
  'splitscreen',
  'terrain',
];

function buildAllExamples() {
  const buildRules = [];
  EXAMPLES.forEach((dir) => buildRules.push(buildSpecificExample(dir)));
  return buildRules;
}

function buildSpecificExample(dir) {
  const rule = {
    entry: `./examples/${dir}/index.js`,
    plugins: [new WorkerPlugin()],
    output: {
      filename: 'build.js',
      path: path.resolve(__dirname, `examples/${dir}/`),
    },
    devtool: 'eval-source-map',
  };
  return rule;
}

function buildWebpackRules() {
  let specificExample = null;
  process.argv.forEach((argv) => {
    if (argv.indexOf('example') > -1) {
      specificExample = argv.split('=')[1];
    }
  });
  if (specificExample) {
    return buildSpecificExample(specificExample);
  }
  return buildAllExamples();
}

module.exports = buildWebpackRules();
