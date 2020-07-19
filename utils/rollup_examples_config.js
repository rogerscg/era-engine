import babel from 'rollup-plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'examples/basic/index.js',
    plugins: [babel({ runtimeHelpers: true }), nodeResolve()],
    output: [
      {
        format: 'esm',
        file: 'examples/basic/build.js',
      },
    ],
  },
];
