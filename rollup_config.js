import babel from 'rollup-plugin-babel';

export default [
  {
    input: 'src/era.js',
    plugins: [babel({ runtimeHelpers: true })],
    output: [
      {
        format: 'esm',
        file: 'build/era.js',
      },
    ],
  },
];
