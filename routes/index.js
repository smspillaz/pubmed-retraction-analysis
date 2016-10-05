var express = require("express");
var Neo4j = require("node-neo4j");
var dbUtils = require("../db/utils");
var util = require("util");
var router = express.Router(); // eslint-disable-line new-cap
var db = (function validateEnvironmentAndConnect() {
  dbUtils.validateEnvironment("bin/www");
  return new Neo4j(dbUtils.createConnectionString());
}());

/* GET home page. */

router.get("/", function handleIndexRequest(req, res) {
  res.render("pubmedRetraction");
});

/**
 * generateQueryForChart
 *
 * Given a @chartName generate a Neo4j query which will yield tuples
 * generating that chart. @arguments is applied to the function generating
 * the query.
 *
 * @chartName {string}: The chart name to generate
 * @returns {array}: An array of tuples of (string, value)
 */
function generateQueryForChart(chartName) {
  var chartDispatch = {
    countryYear: "MATCH(a:Country)-[r]-() " +
                 "RETURN a, count(r) as rel_count " +
                 "ORDER BY rel_count, a.name desc LIMIT 10",
    authorYear: "MATCH(a:Author)-[r]-() " +
                "RETURN a, count(r) as rel_count " +
                "ORDER BY rel_count, a.name desc LIMIT 10"
  };
  var dispatchFunc = null;

  if (Object.keys(chartDispatch).indexOf(chartName) === -1) {
    throw new Error("Don't know how to get chart " + chartName);
  }

  dispatchFunc = chartDispatch[chartName];
  if (typeof dispatchFunc === "string") {
    return util.format.apply(this,
                             [dispatchFunc].concat(Array.prototype.slice.call(arguments, 1)));
  }

  return dispatchFunc.apply(this, Array.prototype.slice.call(arguments, 1));
}

/* API endpoint for the frontend to get a particular
 * chart.
 *
 * Parameters include 'name', which specifies the name
 * of the chart that we want to get.
 */
router.get("/get_bar_chart", function onGetBarChart(req, res) {
  var query = null;
  try {
    query = generateQueryForChart(req.query.name);
  } catch (e) {
    res.json({
      result: "failure",
      reason: String(e)
    });
    return;
  }

  db.cypherQuery(query, function handleQueryRes(err, result) {
    if (err) {
      res.json({
        result: "failure",
        reason: String(err)
      });
      return;
    }

    res.json({
      result: "success",
      data: result.data.map(function forEachRow(r) {
        return {
          name: r[0].name,
          value: r[1]
        };
      })
    });
  });
});

module.exports = router;
