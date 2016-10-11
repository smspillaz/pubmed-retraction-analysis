/* eslint-env mocha */

var expect = require("chai").expect;
var fs = require("fs");
var path = require("path");
var request = require("request");
var testUtils = require("./utils");

var REP_SAMPLE_PATH = path.join(__dirname, "representative_sample.json");
var REPRESENTATIVE_SAMPLE = JSON.parse(fs.readFileSync(REP_SAMPLE_PATH));
var REPRESENTATIVE_BAR_CHART = [
  {
    name: "P Felig",
    value: 3
  },
  {
    name: "B Batlogg",
    value: 2
  },
  {
    name: "J Bouma",
    value: 1
  },
  {
    name: "Steven Roberts",
    value: 1
  },
  {
    name: "R B Mellins",
    value: 1
  },
  {
    name: "Gerard Apodaca",
    value: 1
  },
  {
    name: "P A Berger",
    value: 1
  },
  {
    name: "C E Rowe",
    value: 1
  },
  {
    name: "E C Dunkel",
    value: 1
  },
  {
    name: "L Hood",
    value: 1
  }
];

/**
 * serverUrl
 *
 * Generate a URL used to connect to the testing server.
 *
 * @base {number} - The domain / port the server is running on.
 * @returns {string} - A URL for the server, returning the root endpoint
 */
function serverUrl(base, endpoint) {
  return base + endpoint;
}


describe("Web Server Backend", function bootingServer() {
  var serverInstance = null;
  var serverBase = null;

  before(function before(done) {
    testUtils.startServerWithAutomaticPort(function onStart(server, base, err) {
      expect(err).to.not.to.be.ok; // eslint-disable-line no-unused-expressions
      serverInstance = server;
      serverBase = base;
      done();
    });
  });

  after(function after() {
    serverInstance.close();
  });

  it("4.5.10.0 boots the server and database", function boots() {
  });

  describe("seeded with some mock data", function seededWith() {
    before(function before(done) {
      this.timeout(1000 * 500);
      testUtils.seedDatabaseWith(REPRESENTATIVE_SAMPLE).then(function onDone() {
        done();
      });
    });

    it("4.5.10.0 boots with the server and database", function boots() {
    });

    it("4.5.10.1 allows endpoint request for bar_chart", function getBC(done) {
      request.get(serverUrl(serverBase, "/get_bar_chart"), {
        qs: {
          name: "authorYear"
        }
      }, function onData(error, response, body) {
        var result = JSON.parse(body);
        expect(result.result).to.equal("success");
        expect(result.data).to.deep.equal(REPRESENTATIVE_BAR_CHART);
        done();
      });
    });

    it("4.5.10.2 returns an error for nonexistent charts", function retE(done) {
      request.get(serverUrl(serverBase, "/get_bar_chart"), {
        qs: {
          name: "barFoo"
        }
      }, function onData(error, response, body) {
        var result = JSON.parse(body);
        expect(result.result).to.equal("failure");
        expect(result.reason).to.match(/.*how to get chart barFoo.*/);
        done();
      });
    });

    it("4.5.10.10 returns an error for nonexistent page", function retE(done) {
      request.get(serverUrl(serverBase, "/undefined"),
                  function onData(error, response) {
                    expect(response.statusCode).to.equal(404);
                    done();
                  });
    });
  });
});
