import path from 'path';
import * as esbuild from 'esbuild';

export default async (file, api) => {
  const j = api.jscodeshift;

  const deps = [];

  j(file.source)
    .find(j.ImportDeclaration)
    .forEach((importDeclaration) => {
      deps.push(importDeclaration.value.source.value);
    });

  const dep = path.resolve(process.cwd() + '/test', deps[0]);
  console.log('dep', dep);

  let result = await esbuild.build({
    entryPoints: [dep],
    platform: 'neutral',
    format: 'esm',
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
    if (output.entryPoint) console.log('exports:', output.exports);
  }

  const isDefaultImport = (specifier) => specifier.type === 'ImportDefaultSpecifier';
  const getDefaultImport = (importDeclaration) => importDeclaration.specifiers.find(isDefaultImport);
  const hasDefaultImport = (importDeclaration) => Boolean(getDefaultImport(importDeclaration));
  const isRelativeImport = (importDeclaration) => importDeclaration.source.value.startsWith('.');
  const isScriptImport = (importDeclaration) =>
    !['.json', '.md', '.css', '.svg'].some((ext) => importDeclaration.source.value.endsWith(ext));

  return j(file.source)
    .find(j.ImportDeclaration)
    .filter((path) => hasDefaultImport(path.value))
    .filter((path) => isRelativeImport(path.value))
    .filter((path) => isScriptImport(path.value))
    .forEach((path) => {
      const importDeclaration = path.value;
      importDeclaration.specifiers = importDeclaration.specifiers.map((specifier) => {
        if (isDefaultImport(specifier)) {
          const name = specifier.local.name;
          const namedImport = j.importSpecifier(j.identifier(name));
          return namedImport;
        }
        return specifier;
      });
    })
    .toSource();
};
