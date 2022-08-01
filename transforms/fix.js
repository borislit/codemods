import { extendApi } from './lib/helpers';
import { convertDepsToNamedImports } from './use-named-imports';
import { transformDefaultExportToNamed } from './use-named-exports';
export default async (file, api) => {
  const j = api.jscodeshift;
  const source = j(file.source);

  extendApi(j);
//   await convertDepsToNamedImports(source, file, j);
  transformDefaultExportToNamed(source, file, j);

  return source.toSource();
};
