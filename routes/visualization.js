var express = require("express");
var Neo4j = require("node-neo4j");
var dbUtils = require("../db/utils");
var router = express.Router(); // eslint-disable-line new-cap
var db = (function validateEnvironmentAndConnect() {
  dbUtils.validateEnvironment("bin/www");
  return new Neo4j(dbUtils.createConnectionString());
}());

/* GET home page. */

router.get("/", function handleIndexRequest(req, res) {
  res.render("visualize");
});

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
    country: "MATCH(c:Country { name: '" + filterString + "' })-[ra]-(a:Article)-[rt]-(t:Topic) RETURN c, ra, a, rt, t",
    topic: "MATCH(t:Topic { name: '" + filterString + "' })-[ra]-(a:Article)-[rt]-(c:Country) RETURN t, ra, a, rt, c"
  };
  return filterTypeDispatch[filterType] + " LIMIT 75";
}

/**
 * rowsToGraphNodes
 *
 * @param rows {array} - An odd-sized array, even elements representing nodes
 *                       and odd elements representing elements (0-indexing)
 * @param specification {array} An array the same size as rows describing each
 *                              node or edge
 * @returns {object} - An alchemy-friendly object with a relationship graph
 */
function rowsToGraphNodes(rows, specification) {
  var edges = [];
  var nodes = {};

  if (specification.length % 2 === 0) {
    throw new Error("Specification must be odd-sized");
  }

  rows.forEach(function onEachRow(row) {
    if (row.length !== specification.length) {
      throw new Error("Must provide specification with the same length as rows");
    }

    for (var i = 0; i < row.length; ++i) {  // eslint-disable-line no-plusplus
      /* Even index -> this is a node */
      if (i % 2 === 0) {
        /* Use a map here to deduplicate rows */
        nodes[row[i]._id] = {
          type: specification[i],
          label: row[i].name,
          id: row[i]._id  // eslint-disable-line no-underscore-dangle
        };
      } else {
        edges.push({
          from: row[i - 1]._id,  // eslint-disable-line no-underscore-dangle
          to: row[i + 1]._id  // eslint-disable-line no-underscore-dangle
        });
      }
    }
  });

  return {
    nodes: Object.keys(nodes).map(function onEachNodeKey(k) {
      return nodes[k];
    }),
    edges: edges
  };
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
    if (err) {
      res.json({
        result: "failure",
        reason: String(err)
      });
      return;
    }

    res.json({
      result: "success",
      data: rowsToGraphNodes(result.data, ["Country", "Published In", "Article", "About", "Topic"])
    });
  });
});

module.exports = router;
