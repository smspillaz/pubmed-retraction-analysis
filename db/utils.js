/**
 * validateEnvironment
 *
 * Examine the user's environment variables to check if we can make
 * a connection to a neo4j database.
 *
 * @prog: Name of the current application, to be displayed in an error message.
 */
function validateEnvironment(prog) {
  var requiredVariables = [
    "DATABASE_URL",
    "DATABASE_PASS"
  ];

  requiredVariables.forEach(function onEachReqVar(variableName) {
    if (!process.env[variableName]) {
      throw new Error(variableName + " must be set in the environment before " +
                      "using this tool. For instance, " + variableName +
                      "=.... " + String(prog || ""));
    }
  });

  return true;
}

/**
 * createConnectionString
 *
 * Create a conection string for a neo4j database.
 */
function createConnectionString() {
  return [
    "http://",
    process.env.DATABASE_USER || "",
    ":",
    process.env.DATABASE_PASS,
    "@",
    process.env.DATABASE_URL
  ].join("");
}

module.exports = {
  validateEnvironment: validateEnvironment,
  createConnectionString: createConnectionString
};
