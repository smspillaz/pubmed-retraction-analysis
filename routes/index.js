var express = require("express");
var router = express.Router(); // eslint-disable-line new-cap

/* GET home page. */

router.get("/", function handleIndexRequest(req, res) {
  res.render("pubmedRetraction");
});

/* API endpoint for the frontend to get a particular
 * chart.
 *
 * Parameters include 'name', which specifies the name
 * of the chart that we want to get.
 */
router.get('/get_bar_chart', function(req, res) {
    // Dummy Values
    var values = {
        continentYear: [
            ["Australia", 5],
            ["Asia", 5],
            ["Europe", 10]
            ["South America", 15]
            ["North America", 20]
        ],
        countryYear: [
            ["Australia" 10],
            ["United States", 5],
            ["France", 15]
            ["Canada", 30]
            ["Russian Federation", 10]
        ],
        journalYear: [
            ["Science", 5]
            ["Nature", 10],
            ["Pharmacology", 3]
            ["Radiology", 20]
            ["Harvard Law Review", 15]
        ]
    };

    /* XXX: Currently reading continentYear, but should
     * be able to read an arbitrary chart name. */
    res.json(values.continentYear.map(function(v) {
        return {
            name: v[0],
            value: v[1]
        };
    }));
});
module.exports = router;
