import Ajv from "ajv";

function getDocumentLocation(result) {
  if (result.documentIndex == null) {
    return result.fileLocation;
  }
  return `${result.fileLocation}[${result.documentIndex}]`;
}

function formatErrors(location, errors) {
  const ajv = new Ajv();
  let formattedErrors = [];

  if (errors) {
    formattedErrors = errors.map(function (error) {
      if (
        error.keyword === "additionalProperties" &&
        typeof error.params.additionalProperty === "string"
      ) {
        return {
          ...error,
          message: `${error.message}, found additional property '${error.params.additionalProperty}'`,
        };
      }
      return error;
    });
  }

  return (
    ajv.errorsText(formattedErrors, {
      separator: "\n",
      dataVar: location + "#",
    }) + "\n"
  );
}

export { formatErrors, getDocumentLocation };
