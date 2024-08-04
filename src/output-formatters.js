import Ajv from "ajv";

function formatErrors(filename, errors) {
  const ajv = new Ajv();
  return (
    ajv.errorsText(errors, {
      separator: "\n",
      dataVar: filename + "#",
    }) + "\n"
  );
}

export { formatErrors };
