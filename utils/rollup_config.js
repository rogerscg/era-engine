import buble from '@rollup/plugin-buble';

export default [
	{
		input: 'src/era.js',
		plugins: [
			buble({
				transforms: {
					arrow: false,
					classes: false,
					asyncAwait: false,
					forOf: false
				}
			})
		],
		output: [
			{
				format: 'umd',
				name: 'ERA',
				file: 'build/era.js'
			}
		]
	},
	{
		input: 'src/era.js',
		plugins: [],
		output: [
			{
				format: 'esm',
				file: 'build/era.module.js'
			}
		]
	}
];