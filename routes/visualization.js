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
  res.render("visualize");
});

var filters = {
  country: "Country",
  author: "Author",
  topic: "Topic",
  year: "Year"
};

/**
 * generateQueryForVisualization
 *
 * Given a @chartName generate a Neo4j query which will yield tuples
 * generating that chart. @arguments is applied to the function generating
 * the query.
 *
 * @chartName {string}: The chart name to generate
 * @filterString {string}: A string which may be used to filter on
 * @filterType {string}: What we are filtering for
 * @returns {array}: An array of tuples of (string, value)
 */
function generateQueryForVisualization(filterString, filterType) {
  var filterTypeDispatch = {
    country: "MATCH(c:Country { name: '" + filterString + "'" + " })-[ra]-(a:Article)-[rt]-(t:Topic) RETURN c, ra, a, rt",
    country: "MATCH(t:Topic { name: '" + filterString + "'" + " })-[ra]-(a:Article)-[rt]-(t:Country) RETRUN t, ra, a, rt"
  };
  var limitStatement = ("ORDER BY rel_count desc LIMIT 10");
  return [filterTypeDispatch[filterType], limitStatement].join(" ");
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
router.get("/get_visualisation", function onGetBarChart(req, res) {
  var query = null;
  try {
    query = generateQueryForVisualization(req.query.filterString,
                                          req.query.filterType);
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
