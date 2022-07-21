const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ['./transforms/fix.ts'],
        outdir: 'dist',
        watch: true,
        bundle: true,
        sourcemap: true,
        minify: true,
        platform: 'node',
        target: ['node14'],
    }).then(() => console.log('watching'))
    .catch(() => process.exit(1));