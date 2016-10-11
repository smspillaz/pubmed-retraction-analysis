/* eslint-env mocha */

var expect = require("chai").expect;
var testUtils = require("./utils");
var URL = require("url");
var which = require("which");

describe("Booting the server", function bootingServer() {
  it("4.5.9.2 should fail if DATABASE_URL is not set", function failDB(done) {
    testUtils.withOverriddenEnvironment({
      DATABASE_URL: ""
    }, function inEnv(doneEnv) {
      testUtils.startServerWithAutomaticPort(function onStart(server, port, err) {
        expect(err).to.be.an("error");
        doneEnv();
      });
    }, function onExit() {
      done();
    });
  });

  it("4.5.9.3 should fail if two servers are on the same port", function failTwoServers(done) {
    testUtils.startServerWithAutomaticPort(function onStarted(server, url) {
      var port = URL.parse(url).port;
      which("node", function onFoundNode(err, resolved) {
        if (err) {
          throw new Error("Can't find node in path");
        } else {
          testUtils.invokeProcessForReturnCode([resolved, "bin/www"].join(" "), {
            env: {
              PORT: String(port)
            }
          },
          function onProcDone(code) {
            expect(code).to.equal(1);
            done();
          });
        }
      });
    });
  });

  it("4.5.9.1 should succeed if DATABASE_URL is set", function succeed(done) {
    testUtils.startServerWithAutomaticPort(function onStarted(server, url, err) {
      expect(err).to.be.undefined; // eslint-disable-line no-unused-expressions
      expect(server).to.be.defined; // eslint-disable-line no-unused-expressions
      expect(URL.parse(url).port).to.be.at.least(1000);
      done();
    });
  });
});
