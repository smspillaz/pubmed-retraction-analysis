var express = require("express");
var Neo4j = require("node-neo4j");
var dbUtils = require("../db/utils");
var router = express.Router(); // eslint-disable-line new-cap
var db = (function validateEnvironmentAndConnect() {
  dbUtils.validateEnvironment("bin/www");
  return new Neo4j(dbUtils.createConnectionString());
}());

var names = {
  topicRetraction: "Topic",
  authorRetraction: "Author",
  countryRetraction: "Country",
  retractionsOverTime: "Year"
};

var filters = {
  country: "Country",
  author: "Author",
  topic: "Topic",
  year: "Year"
};

/* GET home page. */

router.get("/", function handleIndexRequest(req, res) {
  res.render("pubmedRetraction");
});

/**
 * generateMatchStatement
 *
 * Generates a neo4j match statement based on some criteria. The match statement
 * either starts from the chartName node if we want all results, or starts
 * from the filterType node (and links to the chartName node) if we're filtering
 * on something
 *
 * @chartName {string} - The name of the chart that we are going to display
 * @filterType {string} - What type of data we might be filtering on
 * @filterString {string} - The string to filter on for the filtered type
 * @returns {string} - A match statement to start a neo4j query with
 */
function generateMatchStatement(chartName, filterType, filterString) {
  if (!filterType) {
    return "MATCH(a:" + names[chartName] + ")-[r]-()";
  }

  return "MATCH(f:" + filters[filterType] + " { name: '" + filterString + "'})-[fr]-(t:Article)-[r]-(a:" + names[chartName] + ")";
}

/**
 * generateQueryForChart
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
function generateQueryForChart(chartName, filterString, filterType) {
  var matchStatement = generateMatchStatement(chartName,
                                              filterType,
                                              filterString);
  var limitStatement = ("RETURN a, count(r) as rel_count " +
                        "ORDER BY rel_count desc LIMIT 10");
  return [matchStatement, limitStatement].join(" ");
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
    query = generateQueryForChart(req.query.name,
                                  req.query.filterString,
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
