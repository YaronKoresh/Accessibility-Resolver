import { defineConfig } from 'tsup';
import { builtinModules } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';

export default defineConfig([{
    name: 'client',
    platform: 'browser',
    shims: false,
    plugins: [
      {
        name: 'block-node-builtins',
        setup(build) {
          const nodes = new Set(builtinModules);
          build.onResolve({ filter: /^node:|^[a-z]+$/ }, (args) => {
            const moduleName = args.path.replace(/^node:/, '');
            if (nodes.has(moduleName)) {
              return { 
                errors: [{ 
                  text: `FORBIDDEN: Node.js module "${args.path}" detected in client build. (Imported by ${args.importer})` 
                }] 
              };
            }
          });
        }
      }
    ],
    entry: ['src/index.ts'],
    outDir: 'dist',
    tsconfig: 'tsconfig/client.json',
    clean: true,
    format: ["iife"],
    globalName: "AccessibilityResolver",
    dts: false,
    splitting: false,
    sourcemap: false,
    minify: true,
    injectStyle: false,
    treeshake: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
}])
