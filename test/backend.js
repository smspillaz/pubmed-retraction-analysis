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
    name: "Wen-ling Zheng",
    value: 1
  },
  {
    name: "W Ambroze",
    value: 1
  },
  {
    name: "Vivian Y H Hook",
    value: 1
  },
  {
    name: "T R Geballe",
    value: 1
  },
  {
    name: "T Matsuda",
    value: 1
  },
  {
    name: "Steven Roberts",
    value: 1
  },
  {
    name: "S Perlman",
    value: 1
  },
  {
    name: "R Padmanabhan",
    value: 1
  },
  {
    name: "R J Levinsky",
    value: 1
  },
  {
    name: "R H Mertelsmann",
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

  it("4.5.0.0 boots the server and database", function boots() {
  });

  describe("seeded with some mock data", function seededWith() {
    before(function before(done) {
      this.timeout(1000 * 500);
      testUtils.seedDatabaseWith(REPRESENTATIVE_SAMPLE).then(function onDone() {
        done();
      });
    });

    it("4.5.0.0 boots with the server and database", function boots() {
    });

    it("4.5.0.1 allows endpoint request for bar_chart", function getBC(done) {
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
  });
});
