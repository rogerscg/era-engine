import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const EXAMPLES = ['basic', 'character', 'maze', 'physics', 'splitscreen'];

const buildRules = [];
EXAMPLES.forEach((dir) => {
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
  buildRules.push(rule);
});

export default buildRules;
