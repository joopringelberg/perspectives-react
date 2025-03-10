import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';

export default [
  {
    input: 'src/perspectives-react-components.ts', // Update this to your entry file
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
      assetFileNames: '[name]-[hash][extname]'
    },
    plugins: [
      del({ targets: 'dist/*' }),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/types',
        rootDir: 'src'
      }),
      replace({
        preventAssignment: true,
        __PPSTORAGELIMIT__: JSON.stringify(10),
        __PPWARNINGLEVEL__: JSON.stringify(5),
        __PPSTORAGEURL__: JSON.stringify("https://mycontexts.com/ppsfs/uploadfile")
      }),
      postcss({
        extract: true, // Extract CSS to a separate file
        minimize: true, // Minimize the CSS
        sourceMap: true // Generate source maps for the CSS
      }),
      json(), // Add the json plugin here
      copy({
        targets: [
          { src: 'src/roledata.d.ts', dest: 'dist/types' },
          { src: 'src/components.css', dest: 'dist/types' }
        ]
      }),
      // terser() // Optional: Minify the output
    ],
    external: [
      'react',
      'react-dom',
      'react-bootstrap',
      '@primer/octicons-react',
      'prop-types',
      'perspectives-proxy',
      'pouchdb-browser',
      'i18next'
    ]
  },
  {
    input: 'dist/types/perspectives-react-components.d.ts',
    output: [{ file: 'dist/perspectives-react-components.d.ts', format: 'es' }],
    plugins: [
      dts(),
      postcss({
        extract: true, // Extract CSS to a separate file
        minimize: true, // Minimize the CSS
        sourceMap: true // Generate source maps for the CSS
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/types',
        rootDir: 'src'
      })
    ],
  }
];