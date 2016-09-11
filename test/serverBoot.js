var expect = require("chai").expect;
var request = require("supertest");
var portfinder = require("portfinder");
var dbUtils = require("../db/utils");
var exec = require("child_process").exec;
var URL = require("url");

function startServer(port, done) {
    var app = require("../app");
    app.set("port", port);
    return app.listen(app.get("port"), done);
}

function startServerWithAutomaticPort(done) {
    portfinder.getPort(function(err, port) {
        try {
            var server = startServer(port, function() {
                url = "http://localhost:" + port;
                done(server, url);
            });
        } catch(e) {
            done(null, null, e);
        }
    });
}

function withOverriddenEnvironment(environment, callback, done) {
    var backup = JSON.parse(JSON.stringify(process.env));
    Object.keys(environment).forEach(function(key) {
        process.env[key] = environment[key];
    });

    /* If done is passed, do this asynchronously. That means restoring
     * the environment once the callback has indicated that it is done */
    if (done) {
        callback(function() {
            process.env = backup;
            done.apply(this, Array.prototype.slice.call(arguments));
        });
    } else {
        try {
            callback();
        } finally {
            proces.env = backup;
        }
    }
}

function invokeProcessForReturnCode(command, options, done) {
    exec(command, options, function(error) {
        done(error.code);
    });
}

dbUtils.validateEnvironment("mocha test");
describe("Booting the server", function() {
    var url = null;
    var server = null;

    it("should fail if DATABASE_URL is not set", function(done) {
        withOverriddenEnvironment({
            DATABASE_URL: undefined
        }, function(done) {
            startServerWithAutomaticPort(function(server, port, err) {
                expect(err).to.be.an('error');
                done();
            });
        }, function() {
            done();
        });
    });

    it("should fail if two servers are on the same port", function(done) {
        startServerWithAutomaticPort(function(server, url, err) {
            var port = URL.parse(url).port;
            invokeProcessForReturnCode("node bin/www", {
                env: {
                    PORT: String(port)
                }
            },
            function(code) {
                expect(code).to.equal(1);
                done();
            });
        });
    });

    it("should succeed if DATABASE_URL is set", function(done) {
        startServerWithAutomaticPort(function(server, url, err) {
            expect(err).to.be.undefined;
            expect(server).to.be.defined;
            expect(URL.parse(url).port).to.be.at.least(1000);
            done();
        });
    });
});