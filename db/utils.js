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
    "NEO_PASS"
  ];

  requiredVariables.forEach(function onEachReqVar(variableName) {
    if (process.env[variableName] === "undefined") {
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
    process.env.NEO_USER || "",
    ":",
    process.env.NEO_PASS,
    "@",
    process.env.DATABASE_URL
  ].join("");
}

module.exports = {
  validateEnvironment: validateEnvironment,
  createConnectionString: createConnectionString
};
