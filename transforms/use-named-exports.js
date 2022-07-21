import { getNameInCamelCase, getNameInPascalCase } from './lib/file';
import { extendApi } from './lib/helpers';

export default (file, api) => {
  const j = api.jscodeshift;
  const f = j(file.source);

  extendApi(j);

  if (f.find(j.ExportDefaultDeclaration).length === 0) {
    console.log(`%s has no default export`, file.path);
    return;
  }

  const exportDefaultDeclaration = f.find(j.ExportDefaultDeclaration);
  const exportedDeclaration = exportDefaultDeclaration.get().value.declaration;

  const topLevelVarNames = f.getTopLevelVarNames();
  const usesReact = f.getImportsByPackageName('react').length > 0;
  const intendedName = usesReact ? getNameInPascalCase(file) : exportedDeclaration.name || getNameInCamelCase(file);
  const caseInsensitiveMatch = (name) => name.toLowerCase() === intendedName.toLowerCase();
  const existingName = topLevelVarNames.find(caseInsensitiveMatch);
  const nameIsInUse = Boolean(existingName);
  const exportName = existingName || intendedName;

  if (!nameIsInUse) {
    const exportDefaultDeclaration = f.find(j.ExportDefaultDeclaration);
    const exportedDeclaration = exportDefaultDeclaration.get().value.declaration;
    if (exportedDeclaration.type === 'ObjectExpression') {
      exportedDeclaration.properties.forEach((property) => {
        const classes = f.getTopLevelClassNames();
        const functions = f.getTopLevelFunctionNames();
        const vars = f.getTopLevelVariableNames();

        if (functions.includes(property.key.name)) {
          f.getTopLevelFunctionByName(property.key.name).replaceWith((path) => f.exportFunction(path));
        }

        if (vars.includes(property.key.name)) {
          f.getTopLevelVariableByName(property.key.name).replaceWith((path) => f.exportVariable(path));
        }
      });

      return exportDefaultDeclaration.toSource();
    }

    if (topLevelVarNames.includes(exportedDeclaration.name)) {
      const classes = f.getTopLevelClassNames();
      const functions = f.getTopLevelFunctionNames();
      const vars = f.getTopLevelVariableNames();

      if (functions.includes(exportedDeclaration.name)) {
        f.getTopLevelFunctionByName(exportedDeclaration.name).replaceWith((path) => f.exportFunction(path));
      }

      if (vars.includes(exportedDeclaration.name)) {
        f.getTopLevelVariableByName(exportedDeclaration.name).replaceWith((path) => f.exportVariable(path));
      }
      return exportDefaultDeclaration
        .replaceWith((path) => {
          return f.exportVarNameAsDefault(exportedDeclaration.name || exportName);
        })
        .toSource();
    } else {
      return exportDefaultDeclaration
        .insertBefore((path) => {
          return f.exportDefaultAsNamed(path, exportName);
        })
        .replaceWith((path) => {
          return f.exportVarNameAsDefault(path.value.declaration.id?.name || exportName);
        })
        .toSource();
    }
  }
  console.log('!nameIsInUse', nameIsInUse);
  const classExportOfName = f.getExportsByClassName(exportName);
  const functionExportOfName = f.getExportsByFunctionName(exportName);
  const namedExportOfName = f.getExportsByVarName(exportName);
  const matchingClass = f.getTopLevelClassByName(exportName);
  const matchingFunction = f.getTopLevelFunctionByName(exportName);
  const matchingVariable = f.getTopLevelVariableByName(exportName);

  if (classExportOfName.length > 0) {
    console.log(`%s already exports a class called %s`, file.path, exportName);
    return;
  }

  if (functionExportOfName.length > 0) {
    console.log(`%s already exports a function called %s`, file.path, exportName);
    return;
  }

  if (namedExportOfName.length > 0) {
    console.log(`%s already exports a const called %s`, file.path, exportName);
    return;
  }

  if (matchingClass.length > 0) {
    console.log(`%s has a class called %s which is not exported`, file.path, exportName);
    return matchingClass.replaceWith(() => f.exportClass(matchingClass.get())).toSource();
  }

  if (matchingFunction.length > 0) {
    console.log(`%s has a function called %s which is not exported`, file.path, exportName);
    return matchingFunction.replaceWith(() => f.exportFunction(matchingFunction.get())).toSource();
  }

  if (matchingVariable.length > 0) {
    console.log(`%s has a variable called %s which is not exported`, file.path, exportName);
    return matchingVariable.replaceWith(() => f.exportVariable(matchingVariable.get())).toSource();
  }
};
