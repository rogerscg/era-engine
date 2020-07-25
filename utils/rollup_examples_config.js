import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const EXAMPLES = [
  'basic',
  'character',
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
    input: `examples/${dir}/index.js`,
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      babel({ runtimeHelpers: true }),
    ],
    output: [
      {
        format: 'iife',
        file: `examples/${dir}/build.js`,
      },
    ],
  };
  return rule;
}

export default (commandLineArgs) => {
  if (commandLineArgs.example) {
    return buildSpecificExample(commandLineArgs.example);
  }
  return buildAllExamples();
};
