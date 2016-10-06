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
                 "ORDER BY rel_count desc LIMIT 10",
    authorYear: "MATCH(a:Author)-[r]-() " +
                "RETURN a, count(r) as rel_count " +
                "ORDER BY rel_count desc LIMIT 10"
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

/**
 * normaliseName
 *
 * Normalise a name such that the name is always in title case.
 *
 * @param name {string} - The name to normalise
 * @returns {string} - The normalised name.
 */
function normaliseName(name) {
  return name.toLowerCase().split(" ").map(function forEachSection(s) {
    return Array.prototype.map.call(s, function forEachChar(c, i) {
      if (i === 0) {
        return c.toUpperCase();
      }

      return c;
    }).join("");
  }).join(" ");
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
    var accumulator = {};

    if (err) {
      res.json({
        result: "failure",
        reason: String(err)
      });
      return;
    }

    /* Merge together entities that really have the same name but
     * with a different capitalisation convention */
    result.data.forEach(function forEachRow(r) {
      var name = normaliseName(r[0].name);
      if (Object.keys(accumulator).indexOf(name) !== -1) {
        accumulator[name] += r[1];
      } else {
        accumulator[name] = r[1];
      }
    });

    res.json({
      result: "success",
      data: Object.keys(accumulator).map(function forEachKey(k) {
        return {
          name: k,
          value: accumulator[k]
        };
      })
    });
  });
});

module.exports = router;
