#!/usr/bin/env node

var neo4j = require("node-neo4j");
var utils = require("./utils");

utils.validateEnvironment("node db-admin.js");

var connectionString = utils.createConnectionString();
console.log("=> Connecting to " + process.env.DATABASE_URL);

var db = new neo4j(connectionString);
var stdin = process.openStdin();

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
