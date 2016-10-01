/* eslint-env mocha */

var expect = require("chai").expect;
var testUtils = require("./utils");
var URL = require("url");
var which = require("which");

describe("Web Server Backend", function bootingServer() {
  var serverInstance = null;

  before(function before(done) {
    testUtils.startServerWithAutomaticPort(function onStart(server, port, err) {
      expect(err).to.not.to.be.ok;
      serverInstance = server;
      done();
    });
  });

  after(function after() {
    serverInstance.close();
  });

  it("4.5.0.0 boots the server and database", function boots() {
  });
});
