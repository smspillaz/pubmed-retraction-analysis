#!/usr/bin/env node

var neo4j = require("node-neo4j");
var utils = require("./utils");

var stdin = process.openStdin();

utils.validateEnvironment("node db-admin.js");
console.log("=> Connecting to " + process.env.DATABASE_URL);

(function runAdminInterface() {
  var connectionString = utils.createConnectionString();
  var db = new neo4j(connectionString);
  stdin.addListener("data", function (d) {
    console.log("=> Running: " + d.toString().trim());
    db.cypherQuery(d.toString().trim(), function (err, result) {
      if (err) {
        console.log(err);
        return;
      }

      console.log(result.data);
      console.log(result.columns);
    });
  });
}());
