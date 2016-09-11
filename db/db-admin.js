#!/usr/bin/env node

var Neo4j = require("node-neo4j");
var utils = require("./utils");

var stdin = process.openStdin();
var stdout = process.stdout;
var stderr = process.stderr;

utils.validateEnvironment("node db-admin.js");
stderr.write("=> Connecting to " + process.env.DATABASE_URL + "\n");

(function runAdminInterface() {
  var connectionString = utils.createConnectionString();
  var db = new Neo4j(connectionString);
  stdin.addListener("data", function handleStdinData(d) {
    stderr.write("=> Running: " + d.toString().trim() + "\n");
    db.cypherQuery(d.toString().trim(), function handleQueryRes(err, result) {
      if (err) {
        stderr.write(String(err) + "\n");
        return;
      }

      stdout.write(JSON.stringify(result.data, null, 2) + "\n");
      stdout.write(JSON.stringify(result.columns, null, 2) + "\n");
    });
  });
}());
