import Ajv from "ajv";

function getDocumentLocation(result) {
  if (result.documentIndex == null) {
    return result.fileLocation;
  }
  return `${result.fileLocation}[${result.documentIndex}]`;
}

function formatErrors(location, errors) {
  const ajv = new Ajv();
  return (
    ajv.errorsText(errors, {
      separator: "\n",
      dataVar: location + "#",
    }) + "\n"
  );
}

export { formatErrors, getDocumentLocation };
