#!/usr/bin/env node

var neo4j = require('node-neo4j');
var requiredVariables = [
    "DATABASE_URL",
    "NEO_USER",
    "NEO_PASS"
];

requiredVariables.forEach(function(variableName) {
    if (!process.env[variableName]) {
        console.error(variableName + " must be set in the environment before " +
                      "using this tool. For instance, " + variableName +
                      "=.... node db-admin.js");
        process.exit(0);
    }
});

var connectionString = [
    'http://',
    process.env.NEO_USER,
    ':',
    process.env.NEO_PASS,
    '@',
    process.env.DATABASE_URL
].join("");
console.log("=> Connecting to " + process.env.DATABASE_URL);

var db = new neo4j(connectionString);
var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    console.log("=> Running: " + d.toString().trim());
    db.cypherQuery(d.toString().trim(), function(err, result) {
        if (err) {
            console.log(err);
            return;
        }

        console.log(result.data);
        console.log(result.columns);
    });
});
