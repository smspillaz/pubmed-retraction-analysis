var express = require('express');
var router = express.Router();

/* GET home page. */

router.get('/', function(req, res) {
  res.render('pubmedRetraction');
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
        continentYear: [5, 5, 10, 15, 20],
        countryYear: [10, 5, 15, 30, 10],
        journalYear: [5, 10, 3, 20, 15]
    };

    /* XXX: Currently reading continentYear, but should
     * be able to read an arbitrary chart name. */
    res.json(values.continentYear.map(function(v) {
        return {
            name: "Foo",
            value: v
        };
    }));
});
module.exports = router;
