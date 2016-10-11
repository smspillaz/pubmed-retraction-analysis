/* eslint-env mocha */
var dbUtils = require("../db/utils");
var testUtils = require("./utils");

var databaseProcess = null;

before(function launchDatabase(done) {
  this.timeout(8000);
  databaseProcess = testUtils.launchTestingDatabase(done);
  testUtils.setTestingDatabaseEnvironment();
  dbUtils.validateEnvironment("mocha test");
});

after(function teardownDatabase() {
  databaseProcess.kill("SIGKILL");
});
