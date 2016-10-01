/* eslint-env mocha */

var expect = require("chai").expect;
var testUtils = require("./utils");

describe("Web Server Backend", function bootingServer() {
  var serverInstance = null;

  before(function before(done) {
    testUtils.startServerWithAutomaticPort(function onStart(server, port, err) {
      expect(err).to.not.to.be.ok; // eslint-disable-line no-unused-expressions
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
