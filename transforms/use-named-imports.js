import path from 'path';
import * as esbuild from 'esbuild';

export async function convertDepsToNamedImports(source, file, api) {
  const deps = [];
  const exportsMap = new Map();
  source.find(api.ImportDeclaration).forEach((importDeclaration) => {
    deps.push(path.resolve(process.cwd() + '/test', importDeclaration.value.source.value));
  });

  const fullpath = path.resolve(process.cwd() + '/test', file.path);
  console.log('dep', fullpath);

  let result = await esbuild.build({
    entryPoints: deps,
    platform: 'neutral',
    format: 'esm',
    outdir: '/tmp/',
    metafile: true,
    write: false,
    loader: {
      '.js': 'jsx',
      '.ts': 'tsx',
    },
    logLevel: 'silent',
  });

  let metafile = result.metafile;

  for (let key in metafile.outputs) {
    let output = metafile.outputs[key];
    if (output.entryPoint) {
      exportsMap.set(path.resolve(process.cwd(), output.entryPoint.split('.')[0]), output.exports);
    }
  }

  const isDefaultImport = (specifier) => specifier.type === 'ImportDefaultSpecifier';
  const getDefaultImport = (importDeclaration) => importDeclaration.specifiers.find(isDefaultImport);
  const hasDefaultImport = (importDeclaration) => Boolean(getDefaultImport(importDeclaration));
  const isRelativeImport = (importDeclaration) => importDeclaration.source.value.startsWith('.');
  const isScriptImport = (importDeclaration) =>
    !['.json', '.md', '.css', '.svg'].some((ext) => importDeclaration.source.value.endsWith(ext));

  source
    .find(api.ImportDeclaration)
    .filter((path) => hasDefaultImport(path.value))
    .filter((path) => isRelativeImport(path.value))
    .filter((path) => isScriptImport(path.value))
    .forEach((importPath) => {
      const id = path.resolve(process.cwd() + '/test', importPath.value.source.value);
      const results = exportsMap.get(id);
      console.log(results);
      const importDeclaration = importPath.value;
      importDeclaration.specifiers = importDeclaration.specifiers.map((specifier) => {
        if (isDefaultImport(specifier)) {
          const name = specifier.local.name;
          const namedImport = api.importSpecifier(api.identifier(results[0]));
          return namedImport;
        }
        return specifier;
      });
    });
}
