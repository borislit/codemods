import { getNameInCamelCase, getNameInPascalCase } from './lib/file';

export async function transformDefaultExportToNamed(source, file, api) {
  if (source.find(api.ExportDefaultDeclaration).length === 0) {
    console.log(`%s has no default export`, file.path);
    return;
  }

  const exportDefaultDeclaration = source.find(api.ExportDefaultDeclaration);
  const exportedDeclaration = exportDefaultDeclaration.get().value.declaration;

  const topLevelVarNames = source.getTopLevelVarNames();
  const usesReact = source.getImportsByPackageName('react').length > 0;
  const intendedName = usesReact ? getNameInPascalCase(file) : exportedDeclaration.name || getNameInCamelCase(file);
  const caseInsensitiveMatch = (name) => name.toLowerCase() === intendedName.toLowerCase();
  const existingName = topLevelVarNames.find(caseInsensitiveMatch);
  const nameIsInUse = Boolean(existingName);
  const exportName = existingName || intendedName;

  if (!nameIsInUse) {
    const exportDefaultDeclaration = source.find(api.ExportDefaultDeclaration);
    const exportedDeclaration = exportDefaultDeclaration.get().value.declaration;
    if (exportedDeclaration.type === 'ObjectExpression') {
      exportedDeclaration.properties.forEach((property) => {
        const classes = source.getTopLevelClassNames();
        const functions = source.getTopLevelFunctionNames();
        const vars = source.getTopLevelVariableNames();

        if (functions.includes(property.key.name)) {
          source.getTopLevelFunctionByName(property.key.name).replaceWith((path) => source.exportFunction(path));
        }

        if (vars.includes(property.key.name)) {
          source.getTopLevelVariableByName(property.key.name).replaceWith((path) => source.exportVariable(path));
        }
      });

      return exportDefaultDeclaration
        .insertBefore((path) => {
          return source.exportDefaultAsNamed(path, exportName);
        })
        .remove();
    }

    if (topLevelVarNames.includes(exportedDeclaration.name)) {
      const classes = source.getTopLevelClassNames();
      const functions = source.getTopLevelFunctionNames();
      const vars = source.getTopLevelVariableNames();

      if (functions.includes(exportedDeclaration.name)) {
        source.getTopLevelFunctionByName(exportedDeclaration.name).replaceWith((path) => source.exportFunction(path));
      }

      if (vars.includes(exportedDeclaration.name)) {
        source.getTopLevelVariableByName(exportedDeclaration.name).replaceWith((path) => source.exportVariable(path));
      }
      return exportDefaultDeclaration.replaceWith((path) => {
        return source.exportVarNameAsDefault(exportedDeclaration.name || exportName);
      });
    } else {
      return exportDefaultDeclaration
        .insertBefore((path) => {
          return source.exportDefaultAsNamed(path, exportName);
        })
        .remove();
    }
  }
  console.log('!nameIsInUse', nameIsInUse);
  const classExportOfName = source.getExportsByClassName(exportName);
  const functionExportOfName = source.getExportsByFunctionName(exportName);
  const namedExportOfName = source.getExportsByVarName(exportName);
  const matchingClass = source.getTopLevelClassByName(exportName);
  const matchingFunction = source.getTopLevelFunctionByName(exportName);
  const matchingVariable = source.getTopLevelVariableByName(exportName);

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
    return matchingClass.replaceWith(() => source.exportClass(matchingClass.get()));
  }

  if (matchingFunction.length > 0) {
    console.log(`%s has a function called %s which is not exported`, file.path, exportName);
    return matchingFunction.replaceWith(() => source.exportFunction(matchingFunction.get()));
  }

  if (matchingVariable.length > 0) {
    console.log(`%s has a variable called %s which is not exported`, file.path, exportName);
    return matchingVariable.replaceWith(() => source.exportVariable(matchingVariable.get()));
  }
}
