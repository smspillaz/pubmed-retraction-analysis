function validateEnvironment(prog) {
  var requiredVariables = [
    "DATABASE_URL",
    "NEO_USER",
    "NEO_PASS"
  ];

  requiredVariables.forEach(function onEachReqVar(variableName) {
    if (process.env[variableName] === "undefined") {
      throw new Error(variableName + " must be set in the environment before " +
                      "using this tool. For instance, " + variableName +
                      "=.... " + String(prog ? prog : ""));
    }
  });

  return true;
}

function createConnectionString() {
  return [
    "http://",
    process.env.NEO_USER,
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
